package com.example.tiendaonline.usuario.mcsv_usuario.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.tiendaonline.usuario.mcsv_usuario.models.Password;

public interface PasswordResetRepository extends JpaRepository<Password, Long>{


   Optional<Password> findTopByEmailAndUsadoFalseOrderByExpiracionDesc(String email);
  


}
