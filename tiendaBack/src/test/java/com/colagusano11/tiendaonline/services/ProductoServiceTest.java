package com.colagusano11.tiendaonline.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.models.ProductoVenta;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;

@ExtendWith(MockitoExtension.class)
public class ProductoServiceTest {


@Mock
private ProductoRepository productoRepository;

@InjectMocks
private ProductoServiceImpl productoServiceImpl;



@Test
void creacionCodigoSku(){
  
  String marca = "Lolita Dinamita";
  String ean = "987645";

  Producto p = new Producto();
  p.setManufacturer(marca.toUpperCase());
  p.setEan(ean);

  String skuTest = productoServiceImpl.createSku(p);

  assertEquals("BTS-LOL-987", skuTest);


  }

  @Test
  void crecionSku2(){
    String manufacturer = "Lorenzo villesi";
    String ean = "314543";

    Producto p = new Producto();
    p.setManufacturer(manufacturer.toUpperCase());
    p.setEan(ean);

    String sku2String = productoServiceImpl.createSku2(p);

    assertEquals("NAY-LOR-314",sku2String); 

  }

  @Test
  void mostrarTodos(){
    int page =0;
    int size =2;

    Pageable pageable = PageRequest.of(page, size);

    Producto p = new Producto();
    p.setId(1L);
    p.setNombre("Perfume 1");
    p.setPrecio(new BigDecimal(23));
    p.setImagen("url.imagen");
    p.setManufacturer("Lorenzo");
    p.setStock(234);
    p.setCategoria("PERFUME");
    p.setGender("Unisex");

    Producto p2 = new Producto();
    p.setId(2L);
    p.setNombre("Perfume 2");
    p.setPrecio(new BigDecimal(34));
    p.setImagen("url.imagen2");
    p.setManufacturer("Patagonia");
    p.setStock(234);
    p.setCategoria("PERFUME");
    p.setGender("MUJER");


    Page<Producto> pagina = new PageImpl<>(List.of(p,p2),pageable, 2);

    when(productoRepository.findAll(pageable)).thenReturn(pagina);

    Page<ProductoVenta> resultado = productoServiceImpl.getAllProductosVenta(page, size);

      assertEquals(2, resultado.getContent().size());
     
      ProductoVenta v1 = resultado.getContent().get(0);
      assertEquals(p.getId(), v1.getId());
      assertEquals(p.getNombre(), v1.getNombre());
      assertEquals(p.getPrecio(), v1.getPrecio());
      assertEquals(p.getImagen(), v1.getImagen());
      assertEquals(p.getManufacturer(), 
      v1.getManufacter());
      assertEquals(p.getStock(), v1.getStock());
      assertEquals(p.getGender(), v1.getGender());
      assertEquals(p.getCategoria(), v1.getCategoria());
}





}
