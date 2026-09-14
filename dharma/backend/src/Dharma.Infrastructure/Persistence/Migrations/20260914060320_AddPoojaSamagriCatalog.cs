using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dharma.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPoojaSamagriCatalog : Migration
    {
        private static readonly string[] CategoryActiveSortColumns = ["IsActive", "SortOrder"];
        private static readonly string[] ProductCategoryAvailabilityColumns = ["CategoryId", "IsActive", "IsAvailable"];
        private static readonly string[] ProductShopSkuColumns = ["PoojaShopId", "Sku"];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pooja_shops",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    OwnerUserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false).Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pooja_shops", x => x.Id);
                    table.ForeignKey("FK_pooja_shops_users_OwnerUserId", x => x.OwnerUserId, "users", "Id", onDelete: ReferentialAction.Restrict);
                }).Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "product_categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false).Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true).Annotation("MySql:CharSet", "utf8mb4"),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false)
                }, constraints: table => table.PrimaryKey("PK_product_categories", x => x.Id)).Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PoojaShopId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CategoryId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false).Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: true).Annotation("MySql:CharSet", "utf8mb4"),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "varchar(3)", maxLength: 3, nullable: false).Annotation("MySql:CharSet", "utf8mb4"),
                    Sku = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false).Annotation("MySql:CharSet", "utf8mb4"),
                    ImageUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true).Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false), IsAvailable = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false), UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false)
                }, constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.Id);
                    table.ForeignKey("FK_products_pooja_shops_PoojaShopId", x => x.PoojaShopId, "pooja_shops", "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_products_product_categories_CategoryId", x => x.CategoryId, "product_categories", "Id", onDelete: ReferentialAction.Restrict);
                }).Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_pooja_shops_OwnerUserId",
                table: "pooja_shops",
                column: "OwnerUserId");
            migrationBuilder.CreateIndex(name: "IX_pooja_shops_Name", table: "pooja_shops", column: "Name");
            migrationBuilder.CreateIndex(name: "IX_product_categories_IsActive_SortOrder", table: "product_categories", columns: CategoryActiveSortColumns);
            migrationBuilder.CreateIndex(name: "IX_product_categories_Name", table: "product_categories", column: "Name", unique: true);
            migrationBuilder.CreateIndex(name: "IX_products_CategoryId_IsActive_IsAvailable", table: "products", columns: ProductCategoryAvailabilityColumns);
            migrationBuilder.CreateIndex(name: "IX_products_PoojaShopId_Sku", table: "products", columns: ProductShopSkuColumns, unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "products");
            migrationBuilder.DropTable(name: "pooja_shops");
            migrationBuilder.DropTable(name: "product_categories");
        }
    }
}
