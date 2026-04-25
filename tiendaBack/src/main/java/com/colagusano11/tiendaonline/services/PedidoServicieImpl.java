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
    private final PaymentGateway paymentGateway;
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
            PaymentGateway paymentGateway,
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
        this.paymentGateway = paymentGateway;
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

        return pedidoRepository.save(pedido);
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

        lp.setPrecioPVP(producto.getPrecio()); // Mantenemos la lógica de guardar el coste aquí
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
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        PedidoEstado estadoActual = pedido.getEstado();

        if (!transicionEstado(estadoActual, nuevoEstado)) {
            throw new IllegalStateException("No se puede realizar el cambio " +
                    estadoActual + " -> " + nuevoEstado);
        }
        pedido.setEstado(nuevoEstado);
        pedidoRepository.save(pedido);
    }

    @Override
    public List<PedidoSalida> historialPedidos(Long usuarioId) {
        List<Pedido> pedidos = pedidoRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
        return pedidos.stream().map(pedidoMapper::toSalida).toList();
    }

    @Override
    public Pedido buscarPorIdYUsuario(Long id, UsuarioRegistroDto usuario) {
        Long usuarioId = usuario.getId();
        return pedidoRepository.findByIdAndUsuarioId(id, usuarioId).orElse(null);
    }

    @Override
    public List<Pedido> findByUsuarioIdOrderByFechaDesc(Long usuarioId) {
        return pedidoRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
    }

    @Override
    public void deletePedido(Long id) {
        pedidoRepository.deleteById(id);
    }

    @Override
    public boolean transicionEstado(PedidoEstado estadoActual, PedidoEstado nuevoEstado) {
        if (estadoActual == nuevoEstado)
            return true;
        return switch (estadoActual) {
            case PENDIENTE -> nuevoEstado == PedidoEstado.RECIBIDO || nuevoEstado == PedidoEstado.CANCELADO
                    || nuevoEstado == PedidoEstado.PAGADO;
            case PENDIENTE_DE_PAGO -> nuevoEstado == PedidoEstado.PAGADO || nuevoEstado == PedidoEstado.CANCELADO;
            case PAGADO -> nuevoEstado == PedidoEstado.RECIBIDO || nuevoEstado == PedidoEstado.ENVIADO
                    || nuevoEstado == PedidoEstado.CANCELADO;
            case RECIBIDO -> nuevoEstado == PedidoEstado.ENVIADO || nuevoEstado == PedidoEstado.CANCELADO;
            case ENVIADO -> nuevoEstado == PedidoEstado.ENTREGADO || nuevoEstado == PedidoEstado.DEVOLUCION_SOLICITADA;
            case ENTREGADO -> nuevoEstado == PedidoEstado.DEVOLUCION_SOLICITADA;
            case DEVOLUCION_SOLICITADA -> nuevoEstado == PedidoEstado.DEVUELTO || nuevoEstado == PedidoEstado.ENTREGADO;
            default -> false;
        };
    }

    @Override
    public void actualizarTracking(Long idPedido, String numSeguimiento, String urlSeguimiento) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        pedido.setNumSeguimiento(numSeguimiento);
        pedido.setUrlSeguimiento(urlSeguimiento);
        // Si se pone tracking, solemos marcar como ENVIADO si estaba en un estado
        // anterior
        if (pedido.getEstado() == PedidoEstado.PAGADO || pedido.getEstado() == PedidoEstado.RECIBIDO) {
            pedido.setEstado(PedidoEstado.ENVIADO);
        }
        pedidoRepository.save(pedido);
    }

    @Override
    public void marcarPedidoPagado(String paymentId) {
        Pedido pedido = pedidoRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new IllegalStateException("Pedido no encontrado para el paymentId: " + paymentId));

        pedido.setEstado(PedidoEstado.PAGADO);
        pedido.setPaymentDate(LocalDateTime.now());
        Pedido pedidoPagado = pedidoRepository.save(pedido);

        pedidoTrak.registrarPago(pedidoPagado);

        // Disparar email de confirmación solo tras el pago exitoso
        try {
            String emailDestino = pedidoPagado.getEmail() != null ? pedidoPagado.getEmail() : "info@erosyafrodita.com";
            emailService.enviarEmailPedido(pedidoPagado, emailDestino);
        } catch (Exception e) {
            System.err.println("Error enviando email tras pago: " + e.getMessage());
        }
    }

    @Override
    public PaymentInitResponse iniciarPago(Long id) {

        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Pedido no encontrado"));

        pedido.setEstado(PedidoEstado.PENDIENTE_DE_PAGO);

        PaymentInitResponse response = paymentGateway.crearPago(pedido);

        // IMPORTANTE: Guardar el pedido de nuevo para persistir el paymentId devuelto
        // por Revolut
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
    public void cambiarCancelado(Long idPedido) {
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
                // Selección Automática Inteligente (Best Provider por precio)
                String ean = linea.getEan();
                if (ean != null && !ean.equals("0")) {
                    List<Producto> opciones = productoRepository.findAllByEanOrderByPrecioAsc(ean);
                    if (!opciones.isEmpty()) {
                        Producto mejorOpcion = opciones.get(0);
                        linea.setDistribuidor(mejorOpcion.getDistribuidor());
                        linea.setSku(mejorOpcion.getSku());
                        linea.setSkuProveedor(mejorOpcion.getSkuProveedor());
                    }
                }
            }
        }

        // 2. Transmisión Física a APIs (BTS / NOVAENGEL)
        Map<Distribuidor, List<PedidoProducto>> grupos = pedido.getLineas().stream()
                .filter(l -> l.getDistribuidor() != null)
                .collect(Collectors.groupingBy(PedidoProducto::getDistribuidor));

        for (Map.Entry<Distribuidor, List<PedidoProducto>> entry : grupos.entrySet()) {
            Distribuidor dist = entry.getKey();
            List<PedidoProducto> items = entry.getValue();

            try {
                if (dist == Distribuidor.BTS) {
                    int shippingCostId = getBtsShippingCostId(pushRequest, items);
                    btsApiClient.createOrder(buildBtsFormData(pushRequest, items, shippingCostId));
                    pedido.setPedidoProveedorId("BTS-" + System.currentTimeMillis());
                } else if (dist == Distribuidor.NOVAENGEL) {
                    novaApiClient.createOrder(buildNovaJson(pushRequest, items));
                    pedido.setPedidoProveedorId("NOVA-" + System.currentTimeMillis());
                }
            } catch (Exception e) {
                System.err.println("Error enviando a " + dist + ": " + e.getMessage());
            }
        }

        pedido.setEstadoProveedor("TRAMITADO");
        // Una vez tramitado con éxito al proveedor, el estado pasa a "PREPARANDO"
        // (RECIBIDO internamente)
        pedido.setEstado(PedidoEstado.RECIBIDO);
        pedidoRepository.save(pedido);
    }

    private String buildBtsFormData(PedidoPushRequest req, List<PedidoProducto> items, int shippingCostId) {
        StringBuilder sb = new StringBuilder();
        sb.append("payment_method=btscredit");

        String countryCode = req.getPais();
        if ("España".equalsIgnoreCase(countryCode) || "Espana".equalsIgnoreCase(countryCode))
            countryCode = "ES";
        if (countryCode != null && countryCode.length() > 2)
            countryCode = countryCode.substring(0, 2).toUpperCase();

        for (int i = 0; i < items.size(); i++) {
            PedidoProducto lp = items.get(i);
            sb.append("&products[").append(i).append("][sku]=").append(encode(cleanSku(lp)));
            sb.append("&products[").append(i).append("][quantity]=").append(lp.getCantidad());
        }

        sb.append("&shipping_cost_id=").append(shippingCostId);
        sb.append("&client_name=").append(encode(req.getNombre())).append(" ").append(encode(req.getApellidos()));
        sb.append("&address=").append(encode(req.getCalle()));
        sb.append("&postal_code=").append(encode(req.getCodigoPostal()));
        sb.append("&city=").append(encode(req.getCiudad()));
        sb.append("&country_code=").append(encode(countryCode != null ? countryCode.toUpperCase() : "ES"));
        sb.append("&telephone=").append(encode(req.getTelefono()));
        sb.append("&dropshipping=1");

        return sb.toString();
    }

    private String buildBtsShippingQuery(PedidoPushRequest req, List<PedidoProducto> items) {
        StringBuilder sb = new StringBuilder();
        String countryCode = req.getPais();
        if ("España".equalsIgnoreCase(countryCode) || "Espana".equalsIgnoreCase(countryCode))
            countryCode = "ES";
        if (countryCode != null && countryCode.length() > 2)
            countryCode = countryCode.substring(0, 2).toUpperCase();

        sb.append("address[country_code]=").append(encode(countryCode != null ? countryCode.toUpperCase() : "ES"));
        sb.append("&address[postal_code]=").append(encode(req.getCodigoPostal()));

        for (int i = 0; i < items.size(); i++) {
            PedidoProducto lp = items.get(i);
            sb.append("&products[").append(i).append("][sku]=").append(encode(cleanSku(lp)));
            sb.append("&products[").append(i).append("][quantity]=").append(lp.getCantidad());
        }

        return sb.toString();
    }

    private int getBtsShippingCostId(PedidoPushRequest req, List<PedidoProducto> items) throws Exception {
        String response = btsApiClient.getShippingPrices(buildBtsShippingQuery(req, items));

        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(response);
            if (root.has("shipping_cost_id")) {
                return root.get("shipping_cost_id").asInt();
            }
            if (root.has("shipping_costs") && root.get("shipping_costs").isArray()
                    && root.get("shipping_costs").size() > 0) {
                com.fasterxml.jackson.databind.JsonNode first = root.get("shipping_costs").get(0);
                if (first.has("shipping_cost_id")) {
                    return first.get("shipping_cost_id").asInt();
                }
            }
        } catch (Exception ignored) {
            // Fallback to regex if response is plain text or non-standard JSON
        }

        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("shipping_cost_id[\"']?[:=]\\s*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(response);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }

        throw new RuntimeException("No se pudo extraer shipping_cost_id de la respuesta BTS: " + response);
    }

    private String encode(String value) {
        try {
            return URLEncoder.encode(value != null ? value : "", StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    private String buildNovaJson(PedidoPushRequest req, List<PedidoProducto> items) {
        Map<String, Object> order = new HashMap<>();
        // Usamos un ID temporal o el que prefiera la API
        order.put("OrderNumber", "E-" + System.currentTimeMillis());
        order.put("Valoration", 0);

        List<Map<String, Object>> lines = new ArrayList<>();
        for (PedidoProducto lp : items) {
            Map<String, Object> line = new HashMap<>();
            line.put("ProductId", cleanSku(lp));
            line.put("Units", lp.getCantidad());
            lines.add(line);
        }
        order.put("Lines", lines);

        String countryCode = req.getPais();
        if ("España".equalsIgnoreCase(countryCode) || "Espana".equalsIgnoreCase(countryCode))
            countryCode = "ES";
        if (countryCode != null && countryCode.length() > 2)
            countryCode = countryCode.substring(0, 2).toUpperCase();

        order.put("Name", req.getNombre());
        order.put("SecondName", req.getApellidos());
        order.put("Telephone", req.getTelefono());
        order.put("Mobile", req.getTelefono());
        order.put("Street", req.getCalle());
        order.put("City", req.getCiudad());
        order.put("County", req.getProvincia());
        order.put("PostalCode", req.getCodigoPostal());
        order.put("Country", countryCode != null ? countryCode.toUpperCase() : "ES");

        try {
            return objectMapper.writeValueAsString(Collections.singletonList(order));
        } catch (Exception e) {
            return "[]";
        }
    }

    private String cleanSku(PedidoProducto i) {
        String base = (i.getSkuProveedor() != null ? i.getSkuProveedor() : i.getSku());
        if (base == null)
            return "";
        if (base.startsWith("B") || base.startsWith("N")) {
            return base.substring(1);
        }
        return base;
    }

    @Override
    public TrackingInfoDTO getTrackingExterno(Long idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        String provId = pedido.getPedidoProveedorId();
        if (provId == null || provId.isEmpty())
            return new TrackingInfoDTO();

        TrackingInfoDTO info = new TrackingInfoDTO();
        try {
            if (provId.startsWith("BTS-")) {
                String realOrderId = provId.replace("BTS-", "");
                String json = btsApiClient.getOrderStatus(realOrderId);
                com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(json);

                if (root.has("status_text"))
                    info.setEstadoProveedor(root.get("status_text").asText());
                if (root.has("tracking_number") && !root.get("tracking_number").isNull())
                    info.setNumSeguimiento(root.get("tracking_number").asText());
                if (root.has("tracking_link") && !root.get("tracking_link").isNull())
                    info.setUrlSeguimiento(root.get("tracking_link").asText());

            } else if (provId.startsWith("NOVA-")) {
                String realOrderId = provId.replace("NOVA-", "");
                String json = novaApiClient.getOrderStatus(realOrderId);
                com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(json);

                if (root.isArray() && root.size() > 0) {
                    com.fasterxml.jackson.databind.JsonNode orderNode = root.get(0);
                    if (orderNode.has("Status"))
                        info.setEstadoProveedor(orderNode.get("Status").asText());
                    if (orderNode.has("TrackingNumber") && !orderNode.get("TrackingNumber").isNull())
                        info.setNumSeguimiento(orderNode.get("TrackingNumber").asText());
                    if (orderNode.has("TrackingUrl") && !orderNode.get("TrackingUrl").isNull())
                        info.setUrlSeguimiento(orderNode.get("TrackingUrl").asText());
                }
            }
            return info;
        } catch (Exception e) {
            System.err.println("Error consultando tracking externo: " + e.getMessage());
            return info;
        }
    }

    @Override
    public void syncTrackingConProveedor(Long idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        TrackingInfoDTO info = getTrackingExterno(idPedido);

        if (info.getEstadoProveedor() != null)
            pedido.setEstadoProveedor(info.getEstadoProveedor());
        if (info.getNumSeguimiento() != null)
            pedido.setNumSeguimiento(info.getNumSeguimiento());
        if (info.getUrlSeguimiento() != null)
            pedido.setUrlSeguimiento(info.getUrlSeguimiento());

        // Si detectamos que ya tiene tracking, marcamos localmente como ENVIADO (EN
        // CAMINO)
        if (pedido.getNumSeguimiento() != null && !pedido.getNumSeguimiento().isBlank()) {
            if (pedido.getEstado() == PedidoEstado.PAGADO || pedido.getEstado() == PedidoEstado.RECIBIDO) {
                pedido.setEstado(PedidoEstado.ENVIADO);
            }
        }

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
}
