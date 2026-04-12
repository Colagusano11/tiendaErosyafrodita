package com.example.tiendaonline.usuario.mcsv_usuario.service;

import com.example.tiendaonline.usuario.mcsv_usuario.dto.MetodoPagoDto;
import com.example.tiendaonline.usuario.mcsv_usuario.models.MetodoPago;
import com.example.tiendaonline.usuario.mcsv_usuario.models.Usuario;
import com.example.tiendaonline.usuario.mcsv_usuario.repository.MetodoPagoRepository;
import com.example.tiendaonline.usuario.mcsv_usuario.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MetodoPagoServiceImpl implements MetodoPagoService {

    private final MetodoPagoRepository repository;
    private final UsuarioRepository usuarioRepository;

    public MetodoPagoServiceImpl(MetodoPagoRepository repository, UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public List<MetodoPagoDto> listarPorUsuario(String email) {
        Usuario u = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return repository.findByUsuarioOrderByIsPrincipalDesc(u).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MetodoPagoDto agregarMetodo(String email, MetodoPagoDto dto) {
        Usuario u = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        MetodoPago mp = new MetodoPago();
        mp.setNombreTitular(dto.getNombreTitular());
        mp.setNumeroEnmascarado(dto.getNumeroEnmascarado());
        mp.setTipoTarjeta(dto.getTipoTarjeta());
        mp.setMesExp(dto.getMesExp());
        mp.setAnioExp(dto.getAnioExp());
        mp.setUsuario(u);

        List<MetodoPago> existentes = repository.findByUsuarioOrderByIsPrincipalDesc(u);
        if (existentes.isEmpty()) {
            mp.setPrincipal(true);
        } else if (dto.isPrincipal()) {
            existentes.forEach(e -> e.setPrincipal(false));
            repository.saveAll(existentes);
            mp.setPrincipal(true);
        }

        return mapToDto(repository.save(mp));
    }

    @Override
    public void eliminarMetodo(Long id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public MetodoPagoDto establecerPrincipal(String email, Long id) {
        Usuario u = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        List<MetodoPago> existentes = repository.findByUsuarioOrderByIsPrincipalDesc(u);
        
        existentes.forEach(e -> e.setPrincipal(e.getId().equals(id)));
        repository.saveAll(existentes);
        
        return mapToDto(repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado")));
    }

    private MetodoPagoDto mapToDto(MetodoPago mp) {
        MetodoPagoDto dto = new MetodoPagoDto();
        dto.setId(mp.getId());
        dto.setNombreTitular(mp.getNombreTitular());
        dto.setNumeroEnmascarado(mp.getNumeroEnmascarado());
        dto.setTipoTarjeta(mp.getTipoTarjeta());
        dto.setMesExp(mp.getMesExp());
        dto.setAnioExp(mp.getAnioExp());
        dto.setPrincipal(mp.isPrincipal());
        return dto;
    }
}
