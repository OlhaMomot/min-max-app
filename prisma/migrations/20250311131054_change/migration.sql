-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "title" TEXT,
    "shop" TEXT,
    "min" TEXT,
    "max" TEXT
);
INSERT INTO "new_Product" ("id", "max", "min", "shop", "title") SELECT "id", "max", "min", "shop", "title" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
