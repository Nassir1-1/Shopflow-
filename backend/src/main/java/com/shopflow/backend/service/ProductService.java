package com.shopflow.backend.service;

import com.shopflow.backend.dto.ProductRequest;
import com.shopflow.backend.dto.ProductResponse;
import com.shopflow.backend.entity.ArtCategory;
import com.shopflow.backend.entity.Category;
import com.shopflow.backend.entity.Product;
import com.shopflow.backend.entity.User;
import com.shopflow.backend.repository.CategoryRepository;
import com.shopflow.backend.repository.ProductRepository;
import com.shopflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository  productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository     userRepository;

    public static final double COMMISSION_RATE = 0.10;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findByActifTrue(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getByCategory(ArtCategory cat, Pageable pageable) {
        return productRepository.findByActifTrueAndArtCategory(cat, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return toResponse(productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found")));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(String q, ArtCategory cat, Pageable pageable) {
        // Pre-lowercase in Java — native SQL query just does LIKE '%:q%'
        String lower = (q == null ? "" : q.toLowerCase());
        if (cat != null) {
            // Pass enum name as String for native SQL
            return productRepository.searchByCategory(lower, cat.name(), pageable)
                    .map(this::toResponse);
        }
        return productRepository.searchProducts(lower, pageable).map(this::toResponse);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User seller  = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<Category> cats = new HashSet<>();
        if (request.getCategoryIds() != null)
            cats = new HashSet<>(categoryRepository.findAllById(request.getCategoryIds()));

        ArtCategory artCat = request.getArtCategory() != null
                ? request.getArtCategory() : ArtCategory.CLASSIC_ART;

        Product product = Product.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .prix(request.getPrix())
                .prixPromo(request.getPrixPromo())
                .stock(request.getStock() != null ? request.getStock() : 0)
                .seller(seller)
                .categories(cats)
                .images(request.getImages())
                .pdfUrl(request.getPdfUrl())
                .authorName(request.getAuthorName())
                .bookYear(request.getBookYear())
                .pageCount(request.getPageCount())
                .artCategory(artCat)
                .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        p.setNom(request.getNom());
        p.setDescription(request.getDescription());
        p.setPrix(request.getPrix());
        p.setPrixPromo(request.getPrixPromo());
        if (request.getStock()       != null) p.setStock(request.getStock());
        if (request.getImages()      != null) p.setImages(request.getImages());
        if (request.getArtCategory() != null) p.setArtCategory(request.getArtCategory());
        return toResponse(productRepository.save(p));
    }

    @Transactional
    public void delete(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        p.setActif(false);
        productRepository.save(p);
    }

    private ProductResponse toResponse(Product p) {
        ProductResponse r = new ProductResponse();
        r.setId(p.getId());
        r.setNom(p.getNom());
        r.setDescription(p.getDescription());
        r.setPrix(p.getPrix());
        r.setPrixPromo(p.getPrixPromo());
        r.setStock(p.getStock());
        r.setActif(p.getActif());
        r.setImages(p.getImages());
        r.setPdfUrl(p.getPdfUrl());
        r.setDateCreation(p.getDateCreation());
        r.setArtCategory(p.getArtCategory());
        r.setAuthorName(p.getAuthorName());
        r.setBookYear(p.getBookYear());
        r.setPageCount(p.getPageCount());
        if (p.getSeller() != null) r.setSellerEmail(p.getSeller().getEmail());
        return r;
    }
}