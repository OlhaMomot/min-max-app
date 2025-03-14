/*
  Warnings:

  - Made the column `productId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shop` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" TEXT NOT NULL,
    "title" TEXT,
    "shop" TEXT NOT NULL,
    "min" TEXT,
    "max" TEXT
);
INSERT INTO "new_Product" ("id", "max", "min", "productId", "shop", "title") SELECT "id", "max", "min", "productId", "shop", "title" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
