package com.shopflow.backend.dto;

import com.shopflow.backend.entity.ArtCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Data
public class ProductRequest {
    @NotBlank
    private String nom;

    private String description;

    @NotNull
    private BigDecimal prix;
    private BigDecimal prixPromo;
    private Integer stock;
    private Set<Long> categoryIds;

    // ── TEXT fields — no 255 limit ───────────────────────
    private String images;     // CLOB in DB — any length
    private String pdfUrl;     // for books

    // ── Book metadata ────────────────────────────────────
    private String  authorName;
    private Integer bookYear;
    private Integer pageCount;
    private List<String> bookTags;   // ["Fiction","History"] → stored as JSON string

    private ArtCategory artCategory = ArtCategory.CLASSIC_ART;
}