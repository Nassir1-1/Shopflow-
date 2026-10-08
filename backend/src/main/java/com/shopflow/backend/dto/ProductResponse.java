package com.shopflow.backend.dto;

import com.shopflow.backend.entity.ArtCategory;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProductResponse {
    private Long        id;
    private String      nom;
    private String      description;
    private BigDecimal  prix;
    private BigDecimal  prixPromo;
    private Integer     stock;
    private Boolean     actif;
    private String      images;
    private String      pdfUrl;
    private String      sellerEmail;
    private LocalDateTime dateCreation;
    private ArtCategory artCategory;
    private String      authorName;
    private Integer     bookYear;
    private Integer     pageCount;
    private List<String> bookTags;
}