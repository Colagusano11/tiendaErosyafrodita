package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;
import com.colagusano11.tiendaonline.mappers.PedidoMapper;
import com.colagusano11.tiendaonline.models.*;
import com.colagusano11.tiendaonline.payments.PaymentGateway;
import com.colagusano11.tiendaonline.payments.dto.PaymentInitResponse;
import com.colagusano11.tiendaonline.repositories.CarritoRepository;
import com.colagusano11.tiendaonline.repositories.PedidoRepository;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.colagusano11.tiendaonline.client.UsuarioFeignClient;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PedidoServicieImpl implements PedidoServicie {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final CarritoRepository carritoRepository;
    private final Map<String, PaymentGateway> gateways;
    private final PedidoTrakingService pedidoTrak;
    private final PedidoMapper pedidoMapper;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private final UsuarioFeignClient usuarioFeignClient;

    public PedidoServicieImpl(
            PedidoRepository pedidoRepository,
            ProductoRepository productoRepository,
            CarritoRepository carritoRepository,
            Map<String, PaymentGateway> gateways,
            PedidoTrakingService pedidoTrak,
            PedidoMapper pedidoMapper,
            ObjectMapper objectMapper,
            EmailService emailService,
            UsuarioFeignClient usuarioFeignClient) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.carritoRepository = carritoRepository;
        this.gateways = gateways;
        this.pedidoTrak = pedidoTrak;
        this.pedidoMapper = pedidoMapper;
        this.objectMapper = objectMapper;
        this.emailService = emailService;
        this.usuarioFeignClient = usuarioFeignClient;
    }

    private Long getUserIdOrDefault(UsuarioRegistroDto usuario) {
        if (usuario == null) return null;
        return usuario.getId();
    }

    @Override
    public List<PedidoSalida> getAllPedidos() {
        return pedidoRepository.findAll()
                .stream()
                .map(pedidoMapper::toSalida)
                .toList();
    }

    @Override
    public Pedido findById(Long id) {
        return pedidoRepository.findById(id).orElse(null);
    }

    @Transactional
    @Override
    public Pedido createPedidoDesdeCarrito(UsuarioRegistroDto usuario, PedidoRequest pedidoRequest) {

        Long usuarioId = getUserIdOrDefault(usuario);

        Pedido pedido = new Pedido();
        pedido.setUsuarioId(usuarioId);
        pedido.setFecha(LocalDateTime.now());
        pedido.setEstado(PedidoEstado.PENDIENTE_DE_PAGO);

        pedido.setNombre(pedidoRequest.getNombre());
        pedido.setApellidos(pedidoRequest.getApellidos());
        pedido.setCalle(pedidoRequest.getCalle());
        pedido.setCiudad(pedidoRequest.getCiudad());
        pedido.setCodigoPostal(pedidoRequest.getCodigoPostal());
        pedido.setProvincia(pedidoRequest.getProvincia());
        pedido.setTelefono(pedidoRequest.getTelefono());
        pedido.setPais(pedidoRequest.getPais());

        // Prioridad: email del Request (invitado) -> email del usuario autenticado -> fallback admin
        String emailDestino = pedidoRequest.getEmail();
        if (emailDestino == null && usuario != null) {
            emailDestino = usuario.getEmail();
        }
        if (emailDestino == null) {
            emailDestino = "info@erosyafrodita.com";
        }
        pedido.setEmail(emailDestino);

        List<PedidoProducto> lineasPedido = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        BigDecimal factorPromo = BigDecimal.ONE;
        if (pedidoRequest.getDescuento() != null && pedidoRequest.getDescuento() > 0
                && pedidoRequest.getDescuento() < 1) {
            factorPromo = BigDecimal.ONE.subtract(BigDecimal.valueOf(pedidoRequest.getDescuento()));
        }

        if (pedidoRequest.getItems() != null && !pedidoRequest.getItems().isEmpty()) {
            // Intentar vincular con usuario existente por email si viene como invitado
            if (usuarioId == null && pedidoRequest.getEmail() != null && !pedidoRequest.getEmail().isBlank()) {
                try {
                    UsuarioRegistroDto existente = usuarioFeignClient.verUser(pedidoRequest.getEmail());
                    if (existente != null) {
                        pedido.setUsuarioId(existente.getId());
                        usuarioId = existente.getId();
                        System.out.println(">>> Pedido de invitado vinculado a usuario existente: " + existente.getEmail());
                    }
                } catch (Exception e) {
                    System.out.println(">>> No se encontro usuario para vincular el pedido: " + pedidoRequest.getEmail());
                }
            }

            for (PedidoRequest.ItemRequest itemReq : pedidoRequest.getItems()) {
                Producto p = productoRepository.findById(itemReq.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + itemReq.getProductoId()));
                lineasPedido.add(crearLineaPedido(pedido, p, itemReq.getCantidad(), factorPromo));
            }
        } else if (usuarioId != null) {
            Carrito carrito = carritoRepository.findByUsuarioId(usuarioId)
                    .orElseThrow(() -> new IllegalStateException("El usuario no tiene carrito ni ha enviado items"));
            if (carrito.getItems().isEmpty()) {
                throw new IllegalStateException("El carrito esta vacio");
            }
            for (CarritoItem itemCarrito : carrito.getItems()) {
                lineasPedido.add(crearLineaPedido(pedido, itemCarrito.getProducto(), itemCarrito.getCantidad(), factorPromo));
            }
        } else {
            throw new IllegalStateException("No hay productos para crear el pedido");
        }

        for (PedidoProducto lp : lineasPedido) {
            total = total.add(lp.getPrecioTotalLinea());
        }

        pedido.setLineas(lineasPedido);
        pedido.setTotal(total);

        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        for (PedidoProducto linea : pedidoGuardado.getLineas()) {
            Producto p = linea.getProducto();
            if (p != null) {
                int cantidad = (linea.getCantidad() != null) ? linea.getCantidad() : 0;
                int stockActual = (p.getStock() != null) ? p.getStock() : 0;
                if (stockActual < cantidad) {
                    throw new IllegalStateException(
                        "Stock insuficiente para el producto: " + p.getNombre()
                        + " (disponible: " + stockActual + ", solicitado: " + cantidad + ")");
                }
                p.setStock(stockActual - cantidad);
                productoRepository.save(p);
            }
        }

        return pedidoGuardado;
    }

    private PedidoProducto crearLineaPedido(Pedido pedido, Producto producto, int cantidad, BigDecimal factorPromo) {
        PedidoProducto lp = new PedidoProducto();
        lp.setPedido(pedido);
        lp.setProducto(producto);
        lp.setCantidad(cantidad);

        BigDecimal precioBase = producto.getPrecioPVP() != null ? producto.getPrecioPVP() : producto.getPrecio();
        BigDecimal precioVenta = precioBase.multiply(factorPromo).setScale(2, java.math.RoundingMode.HALF_UP);
        lp.setPrecioUnitario(precioVenta);

        BigDecimal subtotal = precioVenta.multiply(BigDecimal.valueOf(cantidad));
        lp.setPrecioTotalLinea(subtotal);

        lp.setPrecioPVP(producto.getPrecio());
        lp.setSku(producto.getSku());
        lp.setEan(producto.getEan());
        lp.setNombreProducto(producto.getNombre());
        lp.setDistribuidor(producto.getDistribuidor());
        return lp;
    }

    @Override
    public PedidoSalida mapearPedidoSalida(Pedido pedido) {
        return pedidoMapper.toSalida(pedido);
    }

    @Override
    public Optional<PedidoSalida> obtenerPedidoPorId(Long id) {
        return pedidoRepository.findById(id).map(pedidoMapper::toSalida);
    }

    @Override
    public void cambiarEstado(Long idPedido, PedidoEstado nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalStateException("Pedido no encontrado: " + idPedido));
        pedido.setEstado(nuevoEstado);
        pedidoRepository.save(pedido);
    }

    @Override
    public void deletePedido(Long id) {
        pedidoRepository.deleteById(id);
    }

    @Override
    public Pedido buscarPorIdYUsuario(Long id, UsuarioRegistroDto usuario) {
        if (usuario == null) return null;
        return pedidoRepository.findByIdAndUsuarioId(id, usuario.getId()).orElse(null);
    }

    @Override
    public List<Pedido> findByUsuarioIdOrderByFechaDesc(Long usuarioId) {
        return pedidoRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
    }

    @Override
    public List<PedidoSalida> historialPedidos(Long usuarioId) {
        return pedidoRepository.findByUsuarioIdOrderByFechaDesc(usuarioId)
                .stream()
                .map(pedidoMapper::toSalida)
                .toList();
    }

    @Override
    public boolean transicionEstado(PedidoEstado estadoActual, PedidoEstado nuevoEstado) {
        return true;
    }

    @Override
    @Transactional
    public void marcarPedidoPagado(String paymentId) {
        Pedido pedido = pedidoRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new IllegalStateException("Pedido no encontrado para el paymentId: " + paymentId));

        if (pedido.getEstado() == PedidoEstado.PAGADO) {
            System.out.println("El pedido #" + pedido.getId() + " ya esta marcado como PAGADO. Ignorando.");
            return;
        }
        if (pedido.getEstado() == PedidoEstado.CANCELADO) {
            System.err.println("Se intento marcar como PAGADO un pedido CANCELADO (#" + pedido.getId() + ").");
            return;
        }

        // 🛡️ Verificación server-a-servidor ANTES de marcar como pagado: antes se
        // guardaba PAGADO incondicionalmente y un fallo de captura solo se logueaba,
        // así que cualquiera que conociera un paymentId real (visible en el propio
        // checkout del cliente, ej. inspeccionando la llamada de red) podía llamar a
        // este flujo sin haber pagado de verdad. Si la pasarela no confirma el pago,
        // la excepción se propaga y el pedido NO se marca como pagado.
        String gatewayKey = (pedido.getPaymentGateway() != null) ? pedido.getPaymentGateway() + "Gateway" : "revolutGateway";
        PaymentGateway gateway = gateways.get(gatewayKey);
        if (gateway != null) {
            gateway.capturePago(paymentId);
        }

        pedido.setEstado(PedidoEstado.PAGADO);
        pedido.setPaymentDate(LocalDateTime.now());

        Pedido pedidoPagado = pedidoRepository.save(pedido);
        pedidoTrak.registrarPago(pedidoPagado);

        try {
            String emailDest = pedidoPagado.getEmail() != null ? pedidoPagado.getEmail() : "info@erosyafrodita.com";
            emailService.enviarEmailPedido(pedidoPagado, emailDest);
        } catch (Exception e) {
            System.err.println("Error enviando email tras pago: " + e.getMessage());
        }
    }

    @Override
    public PaymentInitResponse iniciarPago(Long id, String gatewayName) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Pedido no encontrado"));
        pedido.setEstado(PedidoEstado.PENDIENTE_DE_PAGO);

        String key = (gatewayName != null && gateways.containsKey(gatewayName + "Gateway"))
                     ? gatewayName + "Gateway"
                     : "revolutGateway";
        PaymentGateway gateway = gateways.get(key);
        if (gateway == null) throw new RuntimeException("No hay pasarelas de pago configuradas");

        pedido.setPaymentGateway(gatewayName != null ? gatewayName : "revolut");
        PaymentInitResponse response = gateway.crearPago(pedido);
        pedidoRepository.save(pedido);
        return response;
    }

    @Override
    public void cambiarEnviado(Long idPedido) { cambiarEstado(idPedido, PedidoEstado.ENVIADO); }

    @Override
    public void cambiarEntregado(Long idPedido) { cambiarEstado(idPedido, PedidoEstado.ENTREGADO); }

    @Override
    public void cambiarDevolucionSolicitada(Long idPedido) { cambiarEstado(idPedido, PedidoEstado.DEVOLUCION_SOLICITADA); }

    @Override
    public void cambiarDevuelto(Long idPedido) { cambiarEstado(idPedido, PedidoEstado.DEVUELTO); }

    @Override
    @Transactional
    public void cambiarCancelado(Long idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalStateException("Pedido no encontrado: " + idPedido));

        if (pedido.getEstado() != PedidoEstado.CANCELADO
                && pedido.getEstado() != PedidoEstado.ENTREGADO
                && pedido.getEstado() != PedidoEstado.DEVUELTO) {
            if (pedido.getLineas() != null) {
                for (PedidoProducto linea : pedido.getLineas()) {
                    Producto p = linea.getProducto();
                    if (p != null) {
                        int cantidad = (linea.getCantidad() != null) ? linea.getCantidad() : 0;
                        int stockActual = (p.getStock() != null) ? p.getStock() : 0;
                        p.setStock(stockActual + cantidad);
                        productoRepository.save(p);
                    }
                }
            }
        }
        cambiarEstado(idPedido, PedidoEstado.CANCELADO);
    }

    @Override
    public void pushPedidoAProveedor(Long idPedido, PedidoPushRequest pushRequest) {
        // El fulfillment ahora lo gestiona SellerKing mediante GET /api/internal/orders
    }

    @Override
    public void syncTrackingConProveedor(Long idPedido) {
        // El tracking lo notifica SellerKing mediante POST /api/internal/orders/{id}/tracking
    }

    @Override
    public TrackingInfoDTO getTrackingExterno(Long idPedido) {
        // El tracking lo notifica SellerKing mediante POST /api/internal/orders/{id}/tracking
        return null;
    }

    @Override
    public void actualizarTracking(Long idPedido, String numSeguimiento, String urlSeguimiento) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalStateException("Pedido no encontrado: " + idPedido));
        // FIX: usar setNumSeguimiento (no setNumeroSeguimiento)
        pedido.setNumSeguimiento(numSeguimiento);
        pedido.setUrlSeguimiento(urlSeguimiento);
        pedidoRepository.save(pedido);
    }

    @Override
    public Pedido findByPaymentId(String paymentId) {
        return pedidoRepository.findByPaymentId(paymentId).orElse(null);
    }

    @Override
    public Optional<PedidoSalida> rastrearPedido(Long id, String email) {
        return pedidoRepository.findByIdAndEmail(id, email).map(pedidoMapper::toSalida);
    }

    @Override
    public Pedido save(Pedido pedido) {
        return pedidoRepository.save(pedido);
    }

    @Override
    public List<Pedido> findAll() {
        return pedidoRepository.findAll();
    }
}
