package com.shopflow.backend.repository;

import com.shopflow.backend.entity.ArtCategory;
import com.shopflow.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActifTrue(Pageable pageable);
    Page<Product> findByActifTrueAndArtCategory(ArtCategory artCategory, Pageable pageable);
    Page<Product> findBySellerId(Long sellerId, Pageable pageable);

    // ══════════════════════════════════════════════════════════════════
    //  nativeQuery = true  →  skips Hibernate HQL entirely
    //  Raw SQL never triggers the LOWER() type error.
    //  :q must already be lowercased before calling this method
    //  (done in ProductService.search → q.toLowerCase())
    // ══════════════════════════════════════════════════════════════════

    @Query(
            value = "SELECT * FROM products p " +
                    "WHERE p.actif = true " +
                    "AND (LOWER(p.nom) LIKE CONCAT('%', :q, '%') " +
                    "  OR LOWER(p.description) LIKE CONCAT('%', :q, '%'))",
            countQuery = "SELECT count(*) FROM products p " +
                    "WHERE p.actif = true " +
                    "AND (LOWER(p.nom) LIKE CONCAT('%', :q, '%') " +
                    "  OR LOWER(p.description) LIKE CONCAT('%', :q, '%'))",
            nativeQuery = true
    )
    Page<Product> searchProducts(@Param("q") String q, Pageable pageable);

    @Query(
            value = "SELECT * FROM products p " +
                    "WHERE p.actif = true " +
                    "AND p.art_category = :cat " +
                    "AND (LOWER(p.nom) LIKE CONCAT('%', :q, '%') " +
                    "  OR LOWER(p.description) LIKE CONCAT('%', :q, '%'))",
            countQuery = "SELECT count(*) FROM products p " +
                    "WHERE p.actif = true " +
                    "AND p.art_category = :cat " +
                    "AND (LOWER(p.nom) LIKE CONCAT('%', :q, '%') " +
                    "  OR LOWER(p.description) LIKE CONCAT('%', :q, '%'))",
            nativeQuery = true
    )
    Page<Product> searchByCategory(
            @Param("q")   String q,
            @Param("cat") String cat,   // ← String not enum (native SQL)
            Pageable pageable);
}