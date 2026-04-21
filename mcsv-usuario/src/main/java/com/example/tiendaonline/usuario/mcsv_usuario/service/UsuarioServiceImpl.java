package com.example.tiendaonline.usuario.mcsv_usuario.service;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Random;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.tiendaonline.usuario.mcsv_usuario.config.EmailService;
import com.example.tiendaonline.usuario.mcsv_usuario.config.JwtService;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.AuthUsuario;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioDto;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioLogin;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioRegistro;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioRegistroDto;
import com.example.tiendaonline.usuario.mcsv_usuario.models.Usuario;
import com.example.tiendaonline.usuario.mcsv_usuario.repository.UsuarioRepository;
import jakarta.transaction.Transactional;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    private final EmailService emailService;
    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UsuarioServiceImpl(UsuarioRepository repository, PasswordEncoder passwordEncoder, JwtService jwtService, EmailService emailService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Override
    public List<UsuarioRegistroDto> getAll() {
        List<Usuario> usuarios = repository.findAll();
        List<UsuarioRegistroDto> dtos = new ArrayList<>();
        for (Usuario u : usuarios) {
            dtos.add(mapToDto(u));
        }
        return dtos;
    }

    @Override
    @Transactional
    public UsuarioDto registrar(UsuarioRegistro user) {
        if (repository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("El correo electrónico ya está registrado");
        }

        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setEmail(user.getEmail());
        nuevoUsuario.setPassword(passwordEncoder.encode(user.getPassword()));
        nuevoUsuario.setName(user.getName());
        nuevoUsuario.setApellidos(user.getApellidos());
        nuevoUsuario.setPhone(user.getPhone());
        nuevoUsuario.setVerificado(false);
        nuevoUsuario.setCreatedAt(LocalDateTime.now());
        nuevoUsuario.setAdmin(false);

        String codigo = String.format("%06d", new Random().nextInt(1_000_000));
        nuevoUsuario.setCodigoVerifacion(codigo);
        nuevoUsuario.setCodigoExpira(LocalDateTime.now().plusMinutes(15));

        Usuario guardado = repository.save(nuevoUsuario);
        emailService.enviarCodigoDeVerificacion(guardado.getEmail(), codigo);

        UsuarioDto response = new UsuarioDto();
        response.setEmail(guardado.getEmail());
        response.setMessage("Registro exitoso. Por favor, verifica tu correo.");
        return response;
    }

    private static final String DUMMY_BCRYPT_HASH = "$2a$12$EQDAsgLVxLRqMjGsFGBwkeRGH2hqiJJPfP.5vPpPBbXqH3xYzXKXi";

    @Override
    public AuthUsuario login(UsuarioLogin login) {
        // Siempre comparar contra hash dummy para igualar timing
        // (evita email enumeration via timing attack)
        Usuario usuario = repository.findByEmail(login.getEmail()).orElse(null);

        if (usuario != null) {
            // Usuario existe: comparar password real
            if (!passwordEncoder.matches(login.getPassword(), usuario.getPassword())) {
                throw new RuntimeException("Credenciales inválidas");
            }
        } else {
            // Usuario no existe: igualar timing con hash dummy
            passwordEncoder.matches(login.getPassword(), DUMMY_BCRYPT_HASH);
            throw new RuntimeException("Credenciales inválidas");
        }

        if (!usuario.isVerificado()) {
            throw new RuntimeException("Debes verificar tu cuenta antes de iniciar sesión");
        }

        String role = usuario.isAdmin() ? "ROLE_ADMIN" : "ROLE_USER";
        String token = jwtService.generarToken(usuario.getEmail(), role);

        AuthUsuario auth = new AuthUsuario();
        auth.setEmail(usuario.getEmail());
        auth.setToken(token);
        auth.setName(usuario.getName());
        auth.setApellidos(usuario.getApellidos());
        auth.setAdmin(usuario.isAdmin());
        return auth;
    }

    @Override
    public AuthUsuario loginGoogle(String email) {
        Usuario usuario = repository.findByEmail(email)
                .orElseGet(() -> {
                    Usuario u = new Usuario();
                    u.setEmail(email);
                    u.setAdmin(false);
                    u.setVerificado(true); // Google ya está verificado
                    u.setCreatedAt(LocalDateTime.now());
                    u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                    return repository.save(u);
                });

        String role = usuario.isAdmin() ? "ROLE_ADMIN" : "ROLE_USER";
        String token = jwtService.generarToken(email, role);

        AuthUsuario auth = new AuthUsuario();
        auth.setEmail(email);
        auth.setToken(token);
        auth.setName(usuario.getName());
        auth.setApellidos(usuario.getApellidos());
        auth.setAdmin(usuario.isAdmin());
        return auth;
    }

    @Override
    public UsuarioRegistroDto actualizarPerfil(String email, UsuarioRegistroDto datos) {
        Usuario usuario = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setName(datos.getName());
        usuario.setApellidos(datos.getApellidos());
        usuario.setPhone(datos.getPhone());
        usuario.setAvatarUrl(datos.getAvatarUrl());
        usuario.setPais(datos.getPais());
        usuario.setProvincia(datos.getProvincia());
        usuario.setCodigoPostal(datos.getCodigoPostal());
        usuario.setDireccionPrimaria(datos.getDireccionPrimaria());
        usuario.setDireccionSecundaria(datos.getDireccionSecundaria());
        usuario.setFechaNacimiento(datos.getFechaNacimiento());

        usuario.setNumero(datos.getNumero());
        usuario.setEscalera(datos.getEscalera());
        usuario.setPiso(datos.getPiso());
        usuario.setPuerta(datos.getPuerta());
        usuario.setPoblacion(datos.getPoblacion());
        // admin NO se modifica desde actualizarPerfil — solo por endpoint admin explícito

        return mapToDto(repository.save(usuario));
    }

    @Override
    public UsuarioRegistroDto verUser(String email) {
        Usuario usuario = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return mapToDto(usuario);
    }

    @Override
    public void deleteUsuario(String email) {
        Usuario usuario = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        repository.delete(usuario);
    }

    @Override
    public void verificarCodigo(String email, String codigo) {
        Usuario usuario = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (usuario.isVerificado()) {
            throw new RuntimeException("La cuenta ya está verificada");
        }

        if (usuario.getCodigoVerifacion() == null || !usuario.getCodigoVerifacion().equals(codigo)) {
            throw new RuntimeException("Código de verificación incorrecto");
        }

        if (usuario.getCodigoExpira().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El código ha expirado. Solicita uno nuevo.");
        }

        usuario.setVerificado(true);
        usuario.setCodigoVerifacion(null);
        usuario.setCodigoExpira(null);
        repository.save(usuario);
    }

    @Override
    public void resendVerificationCode(String email) {
        Usuario usuario = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (usuario.isVerificado()) {
            throw new RuntimeException("La cuenta ya está verificada");
        }

        String nuevoCodigo = String.format("%06d", new Random().nextInt(1_000_000));
        usuario.setCodigoVerifacion(nuevoCodigo);
        usuario.setCodigoExpira(LocalDateTime.now().plusMinutes(15));
        repository.save(usuario);

        emailService.enviarCodigoDeVerificacion(email, nuevoCodigo);
    }

    @Override
    public void changePassword(String email, String oldPass, String newPass) {
        Usuario usuario = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(oldPass, usuario.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        usuario.setPassword(passwordEncoder.encode(newPass));
        repository.save(usuario);
    }

    private UsuarioRegistroDto mapToDto(Usuario u) {
        UsuarioRegistroDto dto = new UsuarioRegistroDto();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setName(u.getName());
        dto.setApellidos(u.getApellidos());
        dto.setPhone(u.getPhone());
        dto.setAvatarUrl(u.getAvatarUrl());
        dto.setPais(u.getPais());
        dto.setProvincia(u.getProvincia());
        dto.setCodigoPostal(u.getCodigoPostal());
        dto.setDireccionPrimaria(u.getDireccionPrimaria());
        dto.setDireccionSecundaria(u.getDireccionSecundaria());
        dto.setFechaNacimiento(u.getFechaNacimiento());

        dto.setNumero(u.getNumero());
        dto.setEscalera(u.getEscalera());
        dto.setPiso(u.getPiso());
        dto.setPuerta(u.getPuerta());
        dto.setPoblacion(u.getPoblacion());
        dto.setAdmin(u.isAdmin());

        return dto;
    }
}
