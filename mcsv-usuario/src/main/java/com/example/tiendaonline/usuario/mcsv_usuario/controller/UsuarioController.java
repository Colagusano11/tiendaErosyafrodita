package com.example.tiendaonline.usuario.mcsv_usuario.controller;


import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioDto;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioRegistro;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioRegistroDto;
import com.example.tiendaonline.usuario.mcsv_usuario.service.UsuarioService;


@RestController
@RequestMapping("/usuarios")
public class UsuarioController {


  
  private final UsuarioService service;


  public UsuarioController(UsuarioService service) {
    this.service = service;
  }

  
  @GetMapping
  public ResponseEntity<List<UsuarioRegistroDto>> getAll(){
      List<UsuarioRegistroDto> usuarios = service.getAll();

      return ResponseEntity.ok().body(usuarios);

} 

 @PostMapping("/registro")
  public ResponseEntity<UsuarioDto> registrar(@RequestBody UsuarioRegistro user){
    UsuarioDto dto = service.registrar(user);

    return ResponseEntity.ok().body(dto);
 }

 @PutMapping("/{email}")
 public ResponseEntity<UsuarioRegistroDto> actualizarDatos(@PathVariable String email, @RequestBody UsuarioRegistroDto datos, Authentication auth){
    
    if (!auth.getName().equalsIgnoreCase(email) && auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    UsuarioRegistroDto userActualizado = service.actualizarPerfil(email, datos);
    return ResponseEntity.ok(userActualizado);
}

 @GetMapping("/{email}")
 public ResponseEntity<UsuarioRegistroDto> verUser(@PathVariable String email, Authentication auth){
    if (!auth.getName().equalsIgnoreCase(email) && auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    UsuarioRegistroDto dto = service.verUser(email);
    return ResponseEntity.ok().body(dto);
 }

  @DeleteMapping("/{email}")
  public ResponseEntity<Void> deleteUsuario(@PathVariable String email){
    service.deleteUsuario(email);

    return ResponseEntity.noContent().build();
    
  }

  @PutMapping("/{email:.+}/password")
  public ResponseEntity<?> changePassword(@PathVariable("email") String email, @RequestBody Map<String, String> body, Authentication auth) {
      if (!auth.getName().equalsIgnoreCase(email) && auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
          return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
      String oldPassword = body.get("oldPassword") != null ? body.get("oldPassword").trim() : null;
      String newPassword = body.get("newPassword") != null ? body.get("newPassword").trim() : null;
      
      service.changePassword(email, oldPassword, newPassword);
      return ResponseEntity.ok("Contraseña actualizada correctamente");
  }

}
