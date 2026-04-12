package com.colagusano11.tiendaonline.client;


import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.colagusano11.tiendaonline.client.dto.UsuarioDto;
import com.colagusano11.tiendaonline.client.dto.UsuarioRegistro;
import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;


@FeignClient(name = "mcsv-usuarios", contextId = "usuarioFeignClient",
    url = "http://mcsv-usuario:8080"
)
public interface UsuarioFeignClient {


    @GetMapping("/usuarios")
    List<UsuarioRegistroDto> getAll();

    @PostMapping("/usuarios/registro")
    UsuarioDto registrar(@RequestBody UsuarioRegistro user);

    @PutMapping("/usuarios/{email}")
    UsuarioRegistroDto actualizarDatos(@PathVariable String email, @RequestBody UsuarioRegistroDto datos);

    @GetMapping("/usuarios/{email}")
    UsuarioRegistroDto verUser(@PathVariable String email);

    @DeleteMapping ("/usuarios/{email}")
    void deleteUsuario(@PathVariable String email);

    @GetMapping("/usuarios/{email}/pagos")
    List<com.colagusano11.tiendaonline.client.dto.MetodoPagoDto> getMetodos(@PathVariable String email);

    @PostMapping("/usuarios/{email}/pagos")
    com.colagusano11.tiendaonline.client.dto.MetodoPagoDto agregarMetodo(@PathVariable String email, @RequestBody com.colagusano11.tiendaonline.client.dto.MetodoPagoDto dto);

    @DeleteMapping("/usuarios/{email}/pagos/{id}")
    void eliminarMetodo(@PathVariable String email, @PathVariable Long id);

    @PutMapping("/usuarios/{email}/pagos/{id}/principal")
    com.colagusano11.tiendaonline.client.dto.MetodoPagoDto marcarPrincipal(@PathVariable String email, @PathVariable Long id);

    @PutMapping("/usuarios/{email}/password")
    void updatePassword(@PathVariable String email, @RequestBody com.colagusano11.tiendaonline.client.dto.PasswordChangeRequest request);











  

}
