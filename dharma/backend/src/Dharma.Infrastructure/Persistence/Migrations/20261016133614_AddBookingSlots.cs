using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dharma.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingSlots : Migration
    {
        private static readonly string[] SlotPanditServiceStartColumns = ["PanditId", "ServiceId", "StartAtUtc"];
        private static readonly string[] SlotServiceStatusColumns = ["ServiceId", "Status"];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "booking_slots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PanditId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ServiceId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    StartAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false),
                    EndAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booking_slots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_booking_slots_pandit_services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "pandit_services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_booking_slots_pandits_PanditId",
                        column: x => x.PanditId,
                        principalTable: "pandits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_booking_slots_PanditId_ServiceId_StartAtUtc",
                table: "booking_slots",
                columns: SlotPanditServiceStartColumns);

            migrationBuilder.CreateIndex(
                name: "IX_booking_slots_ServiceId_Status",
                table: "booking_slots",
                columns: SlotServiceStatusColumns);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "booking_slots");
        }
    }
}
