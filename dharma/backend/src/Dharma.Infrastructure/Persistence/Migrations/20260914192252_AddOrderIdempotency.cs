using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dharma.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderIdempotency : Migration
    {
        private static readonly string[] CustomerKeyColumns = ["CustomerId", "Key"];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "order_idempotency_records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CustomerId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Key = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequestFingerprint = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OrderId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_idempotency_records", x => x.Id);
                    table.ForeignKey(
                        name: "FK_order_idempotency_records_orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_order_idempotency_records_users_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_order_idempotency_records_CustomerId_Key",
                table: "order_idempotency_records",
                columns: CustomerKeyColumns,
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_order_idempotency_records_OrderId",
                table: "order_idempotency_records",
                column: "OrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "order_idempotency_records");
        }
    }
}
