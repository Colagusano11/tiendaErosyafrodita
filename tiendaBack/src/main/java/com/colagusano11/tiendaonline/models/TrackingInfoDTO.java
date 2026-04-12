package com.colagusano11.tiendaonline.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TrackingInfoDTO {
    private String numSeguimiento;
    private String urlSeguimiento;
    private String estadoProveedor;
}
