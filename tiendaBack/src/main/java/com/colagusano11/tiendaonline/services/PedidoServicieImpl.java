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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.colagusano11.tiendaonline.config.BtsApiClient;
import com.colagusano11.tiendaonline.config.NovaApiClient;
import com.colagusano11.tiendaonline.client.UsuarioFeignClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PedidoServicieImpl implements PedidoServicie {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final CarritoRepository carritoRepository;
    private final Map<String, PaymentGateway> gateways;
    private final PedidoTrakingService pedidoTrak;
    private final PedidoMapper pedidoMapper;
    private final BtsApiClient btsApiClient;
    private final NovaApiClient novaApiClient;
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
            BtsApiClient btsApiClient,
            NovaApiClient novaApiClient,
            ObjectMapper objectMapper,
            EmailService emailService,
            UsuarioFeignClient usuarioFeignClient) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.carritoRepository = carritoRepository;
        this.gateways = gateways;
        this.pedidoTrak = pedidoTrak;
        this.pedidoMapper = pedidoMapper;
        this.btsApiClient = btsApiClient;
        this.novaApiClient = novaApiClient;
        this.objectMapper = objectMapper;
        this.emailService = emailService;
        this.usuarioFeignClient = usuarioFeignClient;
    }

    private Long getUserIdOrDefault(UsuarioRegistroDto usuario) {
        if (usuario == null) {
            return null;
        }
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

        // Prioridad al email del Request (para Invictado) -> Luego al del Usuario -> Luego fallback
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

        // --- DETERMINAR LÍNEAS DEL PEDIDO ---
        // Prioridad 1: Items enviados en el Request (Frontend)
        if (pedidoRequest.getItems() != null && !pedidoRequest.getItems().isEmpty()) {
            // Intentar vincular con un usuario existente por el email si no viene autenticado
            if (usuarioId == null && pedidoRequest.getEmail() != null && !pedidoRequest.getEmail().isBlank()) {
                try {
                    UsuarioRegistroDto existente = usuarioFeignClient.verUser(pedidoRequest.getEmail());
                    if (existente != null) {
                        pedido.setUsuarioId(existente.getId());
                        usuarioId = existente.getId();
                        System.out.println(">>> Pedido de invitado vinculado a usuario existente: " + existente.getEmail());
                    }
                } catch (Exception e) {
                    System.out.println(">>> No se encontró usuario para vincular el pedido: " + pedidoRequest.getEmail());
                }
            }

            for (PedidoRequest.ItemRequest itemReq : pedidoRequest.getItems()) {
                Producto p = productoRepository.findById(itemReq.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + itemReq.getProductoId()));
                lineasPedido.add(crearLineaPedido(pedido, p, itemReq.getCantidad(), factorPromo));
            }

            // NOTA: Ya no vaciamos el carrito aquí. Se vaciará desde el frontend
            // (o tras confirmación real del pago) para que el usuario no pierda
            // los productos si cancela el proceso de pago en la pasarela.
        } 
        // Prioridad 2: Carrito en Base de Datos (solo para usuarios registrados)
        else if (usuarioId != null) {
            Carrito carrito = carritoRepository.findByUsuarioId(usuarioId)
                    .orElseThrow(() -> new IllegalStateException("El usuario no tiene carrito ni ha enviado items"));

            if (carrito.getItems().isEmpty()) {
                throw new IllegalStateException("El carrito está vacío");
            }

            for (CarritoItem itemCarrito : carrito.getItems()) {
                lineasPedido.add(crearLineaPedido(pedido, itemCarrito.getProducto(), itemCarrito.getCantidad(), factorPromo));
            }
            // NOTA: Tampoco vaciamos el carrito aquí por el mismo motivo.
        }
        else {
            throw new IllegalStateException("No hay productos para crear el pedido");
        }

        // Calcular total
        for(PedidoProducto lp : lineasPedido) {
            total = total.add(lp.getPrecioTotalLinea());
        }

        pedido.setLineas(lineasPedido);
        pedido.setTotal(total);

        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        // --- RESERVA DE STOCK: Descontar stock al crear el pedido ---
        // El stock se reserva aqui y se libera si el pago no llega en 15 minutos (StockReservaScheduler).
        // marcarPedidoPagado() ya NO vuelve a descontarlo para evitar doble descuento.
        for (PedidoProducto linea : pedidoGuardado.getLineas()) {
            Producto p = linea.getProducto();
            if (p != null) {
                int cantidad = (linea.getCantidad() != null) ? linea.getCantidad() : 0;
                int stockActual = (p.getStock() != null) ? p.getStock() : 0;
                if (stockActual < cantidad) {
                    // Lanzar excepcion para que la transaccion revierta todo
                    throw new IllegalStateException(
                        "Stock insuficiente para el producto: " + p.getNombre()
                        + " (disponible: " + stockActual + ", solicitado: " + cantidad + ")");
                }
                p.setStock(stockActual - cantidad);
                productoRepository.save(p);
                System.out.println("[STOCK RESERVADO] Producto #" + p.getId() + ": " + stockActual + " -> " + p.getStock());
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

    public PedidoSalida mapearPedidoSalida(Pedido pedido) {
        return pedidoMapper.toSalida(pedido);
    }

    @Override
    public Optional<PedidoSalida> obtenerPedidoPorId(Long id) {
        return pedidoRepository.findById(id)
                .map(pedidoMapper::toSalida);
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

        // --- PROTECCIÓN: Evitar procesar pedidos ya pagados o cancelados ---
        if (pedido.getEstado() == PedidoEstado.PAGADO) {
            System.out.println("El pedido #" + pedido.getId() + " ya está marcado como PAGADO. Ignorando.");
            return;
        }
        if (pedido.getEstado() == PedidoEstado.CANCELADO) {
            System.err.println("Se intentó marcar como PAGADO un pedido CANCELADO (#" + pedido.getId() + ").");
            return;
        }

        pedido.setEstado(PedidoEstado.PAGADO);
        pedido.setPaymentDate(LocalDateTime.now());
        
        // Intentar capturar el pago si la pasarela lo requiere (ej. PayPal)
        try {
            String gatewayKey = (pedido.getPaymentGateway() != null) ? pedido.getPaymentGateway() + "Gateway" : "revolutGateway";
            PaymentGateway gateway = gateways.get(gatewayKey);
            if (gateway != null) {
                gateway.capturePago(paymentId);
            }
        } catch (Exception e) {
            System.err.println("Error capturando pago: " + e.getMessage());
        }

        Pedido pedidoPagado = pedidoRepository.save(pedido);

        // El stock ya fue descontado al crear el pedido (reserva inmediata).
        // No se vuelve a descontar aqui para evitar doble descuento.

        pedidoTrak.registrarPago(pedidoPagado);

        // Disparar email de confirmación solo tras el pago exitoso
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

        // Fallback a revolut si no se especifica o no existe
        String key = (gatewayName != null && gateways.containsKey(gatewayName + "Gateway")) 
                     ? gatewayName + "Gateway" 
                     : "revolutGateway";
        
        PaymentGateway gateway = gateways.get(key);
        if (gateway == null) {
            throw new RuntimeException("No hay pasarelas de pago configuradas");
        }

        pedido.setPaymentGateway(gatewayName != null ? gatewayName : "revolut");
        PaymentInitResponse response = gateway.crearPago(pedido);

        // IMPORTANTE: Guardar el pedido de nuevo para persistir el paymentId devuelto
        pedidoRepository.save(pedido);

        return response;
    }

    @Override
    public void cambiarEnviado(Long idPedido) {
        cambiarEstado(idPedido, PedidoEstado.ENVIADO);
    }

    @Override
    public void cambiarEntregado(Long idPedido) {
        cambiarEstado(idPedido, PedidoEstado.ENTREGADO);
    }

    @Override
    public void cambiarDevolucionSolicitada(Long idPedido) {
        cambiarEstado(idPedido, PedidoEstado.DEVOLUCION_SOLICITADA);
    }

    @Override
    public void cambiarDevuelto(Long idPedido) {
        cambiarEstado(idPedido, PedidoEstado.DEVUELTO);
    }

    @Override
    @Transactional
    public void cambiarCancelado(Long idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalStateException("Pedido no encontrado: " + idPedido));

        // Solo devolver stock si el pedido no estaba ya cancelado o entregado
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
                        System.out.println("[STOCK LIBERADO] Producto #" + p.getId() + ": " + stockActual + " -> " + p.getStock());
                    }
                }
            }
        }

        cambiarEstado(idPedido, PedidoEstado.CANCELADO);
    }

    @Override
    public void pushPedidoAProveedor(Long idPedido, PedidoPushRequest pushRequest) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        Map<Long, Long> manualSelections = pushRequest.getManualSelections();

        // 1. Optimización: Manual o Automática
        for (PedidoProducto linea : pedido.getLineas()) {
            if (manualSelections != null && manualSelections.containsKey(linea.getId())) {
                // Selección Manual por ID de producto (proveedor específico)
                Producto manualP = productoRepository.findById(manualSelections.get(linea.getId()))
                        .orElse(null);
                if (manualP != null) {
                    linea.setDistribuidor(manualP.getDistribuidor());
                    linea.setSku(manualP.getSku());
                    linea.setSkuProveedor(manualP.getSkuProveedor());
                }
            } else {
                // Selección Automática: Buscar el mismo SKU/EAN en todos los proveedores
                String eanBuscado = linea.getEan();
                String skuBuscado = linea.getSku();
                List<Producto> candidatos = productoRepository.findAll().stream()
                    .filter(p -> (
                        (eanBuscado != null && !eanBuscado.isBlank() && eanBuscado.equals(p.getEan())) ||
                        (skuBuscado != null && !skuBuscado.isBlank() && skuBuscado.equals(p.getSku()))
                    ))
                    .collect(Collectors.toList());

                // Elegir el candidato de mayor prioridad o más barato
                Optional<Producto> mejor = candidatos.stream()
                    .filter(p -> p.getDistribuidor() != null)
                    .min(Comparator.comparing(
                        p -> p.getPrecio() != null ? p.getPrecio() : BigDecimal.valueOf(Double.MAX_VALUE)
                    ));

                if (mejor.isPresent()) {
                    Producto mp = mejor.get();
                    linea.setDistribuidor(mp.getDistribuidor());
                    linea.setSku(mp.getSku());
                    linea.setSkuProveedor(mp.getSkuProveedor());
                }
            }
        }

        // 2. Agrupar líneas por distribuidor
        Map<String, List<PedidoProducto>> porDistribuidor = pedido.getLineas().stream()
            .filter(l -> l.getDistribuidor() != null)
            .collect(Collectors.groupingBy(l -> l.getDistribuidor().name()));

        // 3. Enviar a cada distribuidor
        StringBuilder logPush = new StringBuilder();
        for (Map.Entry<String, List<PedidoProducto>> entry : porDistribuidor.entrySet()) {
            String dist = entry.getKey();
            List<PedidoProducto> lineas = entry.getValue();

            try {
                if ("BTS".equalsIgnoreCase(dist)) {
                    btsApiClient.pushPedido(pedido, lineas);
                    logPush.append("BTS OK. ");
                } else if ("NOVA".equalsIgnoreCase(dist) || "NOVAENGEL".equalsIgnoreCase(dist)) {
                    novaApiClient.pushPedido(pedido, lineas);
                    logPush.append("NOVA OK. ");
                } else {
                    logPush.append("Distribuidor desconocido: ").append(dist).append(". ");
                }
            } catch (Exception e) {
                logPush.append(dist).append(" ERROR: ").append(e.getMessage()).append(". ");
            }
        }

        pedido.setPushLog(logPush.toString());
        pedidoRepository.save(pedido);
    }

    @Override
    public void syncTrackingConProveedor(Long idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        String dist = pedido.getLineas() != null && !pedido.getLineas().isEmpty()
                && pedido.getLineas().get(0).getDistribuidor() != null
                ? pedido.getLineas().get(0).getDistribuidor().name()
                : null;

        if (dist == null) {
            System.err.println("Sin distribuidor asignado al pedido #" + idPedido);
            return;
        }

        try {
            String trackingNum = null;
            if ("BTS".equalsIgnoreCase(dist)) {
                trackingNum = btsApiClient.getTracking(pedido);
            } else if ("NOVA".equalsIgnoreCase(dist) || "NOVAENGEL".equalsIgnoreCase(dist)) {
                trackingNum = novaApiClient.getTracking(pedido);
            }

            if (trackingNum != null && !trackingNum.isBlank()) {
                String urlTracking = "https://www.correos.es/ss/Satellite/site/pagina-inicio_buscador_y_seguimiento/sidioma=es_ES&numero=" +
                        URLEncoder.encode(trackingNum, StandardCharsets.UTF_8);
                pedido.setNumeroSeguimiento(trackingNum);
                pedido.setUrlSeguimiento(urlTracking);
                pedidoRepository.save(pedido);
                System.out.println("[TRACKING SYNC] Pedido #" + idPedido + " -> " + trackingNum);
            } else {
                System.out.println("[TRACKING SYNC] Sin tracking disponible aun para pedido #" + idPedido);
            }
        } catch (Exception e) {
            System.err.println("[TRACKING SYNC] Error para pedido #" + idPedido + ": " + e.getMessage());
        }
    }

    @Override
    public TrackingInfoDTO getTrackingExterno(Long idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        String dist = pedido.getLineas() != null && !pedido.getLineas().isEmpty()
                && pedido.getLineas().get(0).getDistribuidor() != null
                ? pedido.getLineas().get(0).getDistribuidor().name()
                : null;

        if (dist == null) return null;

        try {
            String trackingNum = null;
            if ("BTS".equalsIgnoreCase(dist)) {
                trackingNum = btsApiClient.getTracking(pedido);
            } else if ("NOVA".equalsIgnoreCase(dist) || "NOVAENGEL".equalsIgnoreCase(dist)) {
                trackingNum = novaApiClient.getTracking(pedido);
            }

            if (trackingNum != null && !trackingNum.isBlank()) {
                String urlTracking = "https://www.correos.es/ss/Satellite/site/pagina-inicio_buscador_y_seguimiento/sidioma=es_ES&numero=" +
                        URLEncoder.encode(trackingNum, StandardCharsets.UTF_8);
                pedido.setNumeroSeguimiento(trackingNum);
                pedido.setUrlSeguimiento(urlTracking);
                pedidoRepository.save(pedido);

                return new TrackingInfoDTO(trackingNum, urlTracking);
            }
        } catch (Exception e) {
            System.err.println("[TRACKING] Error: " + e.getMessage());
        }
        return null;
    }

    @Override
    public void actualizarTracking(Long idPedido, String numSeguimiento, String urlSeguimiento) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalStateException("Pedido no encontrado: " + idPedido));
        pedido.setNumeroSeguimiento(numSeguimiento);
        pedido.setUrlSeguimiento(urlSeguimiento);
        pedidoRepository.save(pedido);
    }

    @Override
    public Pedido findByPaymentId(String paymentId) {
        return pedidoRepository.findByPaymentId(paymentId).orElse(null);
    }

    @Override
    public Optional<PedidoSalida> rastrearPedido(Long id, String email) {
        return pedidoRepository.findByIdAndEmail(id, email)
                .map(pedidoMapper::toSalida);
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
