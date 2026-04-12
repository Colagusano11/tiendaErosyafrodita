package com.colagusano11.tiendaonline.services;


import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import org.springframework.core.io.ClassPathResource;

import com.colagusano11.tiendaonline.models.Distribuidor;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;

import jakarta.annotation.PostConstruct;

//@Component
public class ProductoNAYPESService {

    private ProductoService productoService;
    private ProductoRepository productoRepository;

    public ProductoNAYPESService(ProductoService productoService, ProductoRepository productoRepository) {
        this.productoService = productoService;
        this.productoRepository = productoRepository;
    }
 //   @Scheduled(cron = "0 20 0 * * *",zone ="Europa/Madrid")
    @PostConstruct
    public void init() {
        try {
            cargarOActualizarProductosNAYPES();
            System.out.println("Productos CSV2 cargados correctamente");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

     public void cargarOActualizarProductosNAYPES()throws Exception{
        try{
            leerCsv();
        }catch(Exception e){
            System.err.println("Error al cargar productos NAYPES: " + e.getMessage());
            }
    }

    private char detectarDelimitador(InputStream is) throws IOException{

    try(BufferedReader bw = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))){
        String primeraLinea = bw.readLine();

           if (primeraLinea == null || primeraLinea.isBlank()) {
            throw new IOException("El archivo está vacío o no tiene cabecera para detectar el delimitador");
        }
        return primeraLinea.contains(";") ? ';' : ',';
    }
}
      



   
   public void leerCsv() throws Exception {
        
    ClassPathResource resource = new ClassPathResource("Naypes_productos.csv");
     char delimitador = detectarDelimitador(resource.getInputStream());

        try (InputStream inputStream = resource.getInputStream();
                CSVParser csvParser = CSVFormat.DEFAULT.builder()
                        .setDelimiter(delimitador)
                        .setHeader()
                        .setSkipHeaderRecord(true)
                        .build()
                        .parse(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

                for (CSVRecord record : csvParser) {
                try {
                    procesarLinea(record);

                }catch (Exception e) {
                    System.err.println("Error cargando producto: " + record + " - " + e.getMessage());


                }
            }
        }
    }

        public void procesarLinea(CSVRecord record) {
                 Distribuidor distribuidor = Distribuidor.NAYPES;
                    String csvEan = record.get("Código EAN");
                     Optional<Producto> productoActualizar = productoRepository
                             .findByEanAndDistribuidor(csvEan, distribuidor);
                  Producto producto;

                        if(productoActualizar.isPresent()) {
                            producto = productoActualizar.get();
                        String csvStock = record.get("Stock").trim();
                          int nuevoStrock = csvStock.isEmpty() ? 0 : Integer.parseInt(csvStock);
                          producto.setStock(nuevoStrock);
                         }else{

                     producto = new Producto();


                    producto.setEan(record.get("Código EAN"));
                    producto.setNombre(record.get("Descripción"));

                                        String precioStr = record.get("Precio")
                            .replace("€", "")
                            .replace(",", ".")
                            .trim();

                    // Si está vacío, lo tratamos como 0
                    if (precioStr.isEmpty()) {
                        return; // o 'continue;' si estás dentro de un for
                    }

                    BigDecimal precio = new BigDecimal(precioStr);

                    // Si precio <= 0, NO guardamos este producto
                    if (precio.compareTo(BigDecimal.ZERO) <= 0) {
                        // aquí puedes hacer un log siprecio 0: {}", record);
                        return; // o 'continue;' en un bucle
                    } producto.setPrecio(precio);
                    


                    String stockStr = record.get("Stock").trim();
                    producto.setStock(stockStr.isEmpty() ? 0 : Integer.parseInt(stockStr));
                    producto.setManufacturer(record.get("Marca"));
                    producto.setCategoria(record.get("Categoría"));
                    producto.setImagen(record.get("Url Imagen"));
                    producto.setDescripcion(record.get("Descripción adicional"));
                    producto.setGender(record.get("subcategoría"));
                   
                   
                String precioPVPstr = record.get("Precio")
                                .replace("€","")

                                .replace(",","." )
                                .trim();
                    BigDecimal precioPVP = new BigDecimal (precioPVPstr);
                    producto.setPrecioPVP(precioPVP);

                String sku2 = productoService.createSku2(producto);
                producto.setSku(sku2);
                producto.setDistribuidor(distribuidor);
                }

        productoRepository.save(producto);
    }
}


