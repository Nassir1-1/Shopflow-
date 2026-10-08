package com.shopflow.backend.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class FeeCalculationService {

    private static final BigDecimal TEN       = new BigDecimal("10");
    private static final BigDecimal FIFTY     = new BigDecimal("50");
    private static final BigDecimal ONE_FIFTY = new BigDecimal("150");
    private static final BigDecimal THREE_H   = new BigDecimal("300");
    private static final BigDecimal FOUR_H    = new BigDecimal("400");
    private static final BigDecimal SIX_H     = new BigDecimal("600");
    private static final BigDecimal ONE_K     = new BigDecimal("1000");

    private static final BigDecimal FLAT_20 = new BigDecimal("20");
    private static final BigDecimal FLAT_50 = new BigDecimal("50");
    private static final BigDecimal FLAT_60 = new BigDecimal("60");
    private static final BigDecimal FLAT_70 = new BigDecimal("70");

    private static final BigDecimal RATE_10  = new BigDecimal("0.10");
    private static final BigDecimal RATE_085 = new BigDecimal("0.085");
    private static final BigDecimal RATE_06  = new BigDecimal("0.06");

    /** Everything the caller needs to complete a transaction. */
    public record FeeResult(
            BigDecimal itemPrice,     // original listing price
            BigDecimal totalFee,      // what the platform keeps
            BigDecimal buyerFee,      // added to buyer's charge
            BigDecimal sellerFee,     // deducted from seller's payout
            BigDecimal buyerTotal,    // itemPrice + buyerFee   (charge buyer this)
            BigDecimal sellerPayout,  // itemPrice - sellerFee  (pay seller this)
            String     tierLabel
    ) {}

    public FeeResult calculate(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("Price must be non-negative.");

        // Below minimum → no fee
        if (price.compareTo(TEN) < 0)
            return buildResult(price, BigDecimal.ZERO, "Below 10 DT — no fee");

        BigDecimal totalFee;
        String     label;

        if (price.compareTo(FIFTY) <= 0) {
            totalFee = price.multiply(RATE_10);
            label    = "Tier 1 (10–50 DT): 10%";
        } else if (price.compareTo(ONE_FIFTY) <= 0) {
            totalFee = price.multiply(RATE_085);
            label    = "Tier 2 (>50–150 DT): 8.5%";
        } else if (price.compareTo(THREE_H) <= 0) {
            totalFee = price.multiply(RATE_06);
            label    = "Tier 3 (>150–300 DT): 6%";
        } else if (price.compareTo(FOUR_H) <= 0) {
            totalFee = FLAT_20;
            label    = "Tier 4 (>300–400 DT): flat 20 DT";
        } else if (price.compareTo(SIX_H) <= 0) {
            totalFee = FLAT_50;
            label    = "Tier 5 (>400–600 DT): flat 50 DT";
        } else if (price.compareTo(ONE_K) <= 0) {
            totalFee = FLAT_60;
            label    = "Tier 6 (>600–1000 DT): flat 60 DT";
        } else {
            totalFee = FLAT_70;
            label    = "Tier 7 (>1000 DT): flat 70 DT";
        }

        return buildResult(price, totalFee, label);
    }

    private FeeResult buildResult(BigDecimal price, BigDecimal totalFee, String label) {
        // Split 50 / 50 — any rounding remainder goes to buyer
        BigDecimal sellerFee  = totalFee.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        BigDecimal buyerFee   = totalFee.subtract(sellerFee);

        return new FeeResult(
                price.setScale(2, RoundingMode.HALF_UP),
                totalFee.setScale(2, RoundingMode.HALF_UP),
                buyerFee.setScale(2, RoundingMode.HALF_UP),
                sellerFee.setScale(2, RoundingMode.HALF_UP),
                price.add(buyerFee).setScale(2, RoundingMode.HALF_UP),
                price.subtract(sellerFee).setScale(2, RoundingMode.HALF_UP),
                label
        );
    }
}