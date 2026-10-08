package com.shopflow.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "products")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(nullable = false)
    private String nom;

    // ── CLOB columns — unlimited length ──────────────────
    @Lob
    @Column(columnDefinition = "CLOB")
    private String description;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String images;

    @Lob
    @Column(name = "pdf_url", columnDefinition = "CLOB")
    private String pdfUrl;             // nullable — art products won't have this

    // ── FIX 4: book fields ALL nullable ──────────────────
    // Art uploads must not fail because these are absent.
    @Column(name = "author_name", nullable = true)
    private String authorName;

    @Column(name = "book_year", nullable = true)
    private Integer bookYear;

    @Column(name = "page_count", nullable = true)
    private Integer pageCount;

    @Column(name = "book_tags", length = 500, nullable = true)
    private String bookTags;           // JSON array string — null for art

    // ── Category ─────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "art_category", nullable = false)
    @Builder.Default
    private ArtCategory artCategory = ArtCategory.CLASSIC_ART;

    // ── Pricing ──────────────────────────────────────────
    @Column(nullable = false)
    private BigDecimal prix;

    private BigDecimal prixPromo;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Builder.Default
    private Boolean actif = true;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    @ManyToMany
    @JoinTable(
            name = "product_categories",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<Category> categories;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews;
}