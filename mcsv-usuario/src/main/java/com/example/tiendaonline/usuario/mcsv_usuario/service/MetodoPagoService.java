package com.example.tiendaonline.usuario.mcsv_usuario.service;

import com.example.tiendaonline.usuario.mcsv_usuario.dto.MetodoPagoDto;
import java.util.List;

public interface MetodoPagoService {
    List<MetodoPagoDto> listarPorUsuario(String email);
    MetodoPagoDto agregarMetodo(String email, MetodoPagoDto dto);
    void eliminarMetodo(Long id);
    MetodoPagoDto establecerPrincipal(String email, Long id);
}
