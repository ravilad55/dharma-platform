using Dharma.SharedKernel.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class DharmaDbContext(DbContextOptions<DharmaDbContext> options) : DbContext(options), IUnitOfWork
{
    public DbSet<OutboxRecord> Outbox => Set<OutboxRecord>();
    public DbSet<InboxRecord> Inbox => Set<InboxRecord>();
    public DbSet<IdentityUserRecord> IdentityUsers => Set<IdentityUserRecord>();
    public DbSet<IdentityCustomerProfileRecord> IdentityCustomerProfiles => Set<IdentityCustomerProfileRecord>();
    public DbSet<IdentityOtpChallengeRecord> IdentityOtpChallenges => Set<IdentityOtpChallengeRecord>();
    public DbSet<IdentitySessionRecord> IdentitySessions => Set<IdentitySessionRecord>();
    public DbSet<IdentityRefreshTokenRecord> IdentityRefreshTokens => Set<IdentityRefreshTokenRecord>();
    public DbSet<IdentityRoleRecord> IdentityRoles => Set<IdentityRoleRecord>();
    public DbSet<IdentityUserRoleRecord> IdentityUserRoles => Set<IdentityUserRoleRecord>();
    public DbSet<AuthAuditEventRecord> AuthAuditEvents => Set<AuthAuditEventRecord>();
    public DbSet<PoojaShopRecord> PoojaShops => Set<PoojaShopRecord>();
    public DbSet<ProductCategoryRecord> ProductCategories => Set<ProductCategoryRecord>();
    public DbSet<ProductRecord> Products => Set<ProductRecord>();
        public DbSet<CartRecord> Carts => Set<CartRecord>();
        public DbSet<CartItemRecord> CartItems => Set<CartItemRecord>();
        public DbSet<OrderRecord> Orders => Set<OrderRecord>();
        public DbSet<OrderItemRecord> OrderItems => Set<OrderItemRecord>();
        public DbSet<OrderAddressRecord> OrderAddresses => Set<OrderAddressRecord>();
        public DbSet<OrderStatusHistoryRecord> OrderStatusHistory => Set<OrderStatusHistoryRecord>();
        public DbSet<CustomerAddressRecord> CustomerAddresses => Set<CustomerAddressRecord>();
        public DbSet<OrderIdempotencyRecord> OrderIdempotencyRecords => Set<OrderIdempotencyRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OutboxRecord>(entity =>
        {
            entity.ToTable("outbox_messages");
            entity.HasKey(message => message.Id);
            entity.Property(message => message.EventType).HasMaxLength(250).IsRequired();
            entity.Property(message => message.Payload).IsRequired();
            entity.Property(message => message.IdempotencyKey).HasMaxLength(250);
            entity.HasIndex(message => new { message.PublishedAt, message.OccurredAt });
        });

        modelBuilder.Entity<CartRecord>(entity =>
        {
            entity.ToTable("carts");
            entity.HasKey(cart => cart.Id);
            entity.Property(cart => cart.Currency).HasMaxLength(3).IsRequired();
            entity.HasIndex(cart => cart.CustomerId).IsUnique();
            entity.HasIndex(cart => new { cart.ShopId, cart.Status });
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(cart => cart.CustomerId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<PoojaShopRecord>().WithMany().HasForeignKey(cart => cart.ShopId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CartItemRecord>(entity =>
        {
            entity.ToTable("cart_items");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.UnitPrice).HasPrecision(18, 2);
            entity.Property(item => item.Currency).HasMaxLength(3).IsRequired();
            entity.HasIndex(item => new { item.CartId, item.ProductId }).IsUnique();
            entity.HasIndex(item => item.CartId);
            entity.HasOne<CartRecord>().WithMany().HasForeignKey(item => item.CartId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ProductRecord>().WithMany().HasForeignKey(item => item.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderRecord>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(order => order.Id);
            entity.Property(order => order.OrderNumber).HasMaxLength(32).IsRequired();
            entity.Property(order => order.Currency).HasMaxLength(3).IsRequired();
            entity.Property(order => order.Subtotal).HasPrecision(18, 2);
            entity.Property(order => order.TaxAmount).HasPrecision(18, 2);
            entity.Property(order => order.DiscountAmount).HasPrecision(18, 2);
            entity.Property(order => order.DeliveryFee).HasPrecision(18, 2);
            entity.Property(order => order.TotalAmount).HasPrecision(18, 2);
            entity.HasIndex(order => order.OrderNumber).IsUnique();
            entity.HasIndex(order => new { order.CustomerId, order.Status, order.CreatedAtUtc });
            entity.HasIndex(order => new { order.ShopId, order.Status, order.CreatedAtUtc });
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(order => order.CustomerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<PoojaShopRecord>().WithMany().HasForeignKey(order => order.ShopId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderItemRecord>(entity =>
        {
            entity.ToTable("order_items", table => table.HasCheckConstraint("CK_order_items_quantity_positive", "Quantity > 0"));
            entity.HasKey(item => item.Id);
            entity.Property(item => item.ProductNameSnapshot).HasMaxLength(200).IsRequired();
            entity.Property(item => item.SkuSnapshot).HasMaxLength(100).IsRequired();
            entity.Property(item => item.Currency).HasMaxLength(3).IsRequired();
            entity.Property(item => item.UnitPrice).HasPrecision(18, 2);
            entity.Property(item => item.TaxAmount).HasPrecision(18, 2);
            entity.Property(item => item.DiscountAmount).HasPrecision(18, 2);
            entity.Property(item => item.LineTotal).HasPrecision(18, 2);
            entity.HasIndex(item => item.OrderId);
            entity.HasIndex(item => item.ProductId);
            entity.HasOne<OrderRecord>().WithMany().HasForeignKey(item => item.OrderId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ProductRecord>().WithMany().HasForeignKey(item => item.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderAddressRecord>(entity =>
        {
            entity.ToTable("order_addresses");
            entity.HasKey(address => address.Id);
            entity.Property(address => address.ContactName).HasMaxLength(200).IsRequired();
            entity.Property(address => address.ContactPhone).HasMaxLength(32).IsRequired();
            entity.Property(address => address.AddressLine1).HasMaxLength(300).IsRequired();
            entity.Property(address => address.AddressLine2).HasMaxLength(300);
            entity.Property(address => address.City).HasMaxLength(100).IsRequired();
            entity.Property(address => address.State).HasMaxLength(100).IsRequired();
            entity.Property(address => address.PostalCode).HasMaxLength(20).IsRequired();
            entity.Property(address => address.Country).HasMaxLength(2).IsRequired();
            entity.Property(address => address.Latitude).HasPrecision(9, 6);
            entity.Property(address => address.Longitude).HasPrecision(9, 6);
            entity.HasIndex(address => address.OrderId).IsUnique();
            entity.HasOne<OrderRecord>().WithMany().HasForeignKey(address => address.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderStatusHistoryRecord>(entity =>
        {
            entity.ToTable("order_status_history");
            entity.HasKey(history => history.Id);
            entity.Property(history => history.Actor).HasMaxLength(100).IsRequired();
            entity.Property(history => history.Reason).HasMaxLength(1000);
            entity.HasIndex(history => new { history.OrderId, history.CreatedAtUtc });
            entity.HasOne<OrderRecord>().WithMany().HasForeignKey(history => history.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CustomerAddressRecord>(entity =>
        {
            entity.ToTable("customer_addresses");
            entity.HasKey(address => address.Id);
            entity.Property(address => address.Label).HasMaxLength(100).IsRequired();
            entity.Property(address => address.ContactName).HasMaxLength(200).IsRequired();
            entity.Property(address => address.ContactPhone).HasMaxLength(32).IsRequired();
            entity.Property(address => address.AddressLine1).HasMaxLength(300).IsRequired();
            entity.Property(address => address.AddressLine2).HasMaxLength(300);
            entity.Property(address => address.City).HasMaxLength(100).IsRequired();
            entity.Property(address => address.State).HasMaxLength(100).IsRequired();
            entity.Property(address => address.PostalCode).HasMaxLength(20).IsRequired();
            entity.Property(address => address.Country).HasMaxLength(2).IsRequired();
            entity.Property(address => address.Latitude).HasPrecision(9, 6);
            entity.Property(address => address.Longitude).HasPrecision(9, 6);
            entity.HasIndex(address => new { address.CustomerId, address.IsDefault, address.CreatedAtUtc });
            entity.HasIndex(address => address.DefaultForCustomerId).IsUnique();
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(address => address.CustomerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderIdempotencyRecord>(entity =>
        {
            entity.ToTable("order_idempotency_records");
            entity.HasKey(record => record.Id);
            entity.Property(record => record.Key).HasMaxLength(250).IsRequired();
            entity.Property(record => record.RequestFingerprint).HasMaxLength(64).IsRequired();
            entity.HasIndex(record => new { record.CustomerId, record.Key }).IsUnique();
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(record => record.CustomerId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<OrderRecord>().WithMany().HasForeignKey(record => record.OrderId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InboxRecord>(entity =>
        {
            entity.ToTable("inbox_messages");
            entity.HasKey(message => new { message.EventId, message.Consumer });
            entity.Property(message => message.Consumer).HasMaxLength(250);
        });

        modelBuilder.Entity<IdentityUserRecord>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PhoneNormalized).HasMaxLength(32).IsRequired();
            entity.Property(x => x.PhoneLookupHash).HasMaxLength(128).IsRequired();
            entity.Property(x => x.DisplayName).HasMaxLength(200);
            entity.Property(x => x.CreatedBy).HasMaxLength(100);
            entity.Property(x => x.UpdatedBy).HasMaxLength(100);
            entity.HasIndex(x => x.PhoneNormalized).IsUnique();
            entity.HasIndex(x => x.PhoneLookupHash).IsUnique();
        });

        modelBuilder.Entity<IdentityCustomerProfileRecord>(entity =>
        {
            entity.ToTable("customer_profiles");
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.Preferences).HasMaxLength(4000);
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IdentityOtpChallengeRecord>(entity =>
        {
            entity.ToTable("otp_challenges");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PhoneNormalized).HasMaxLength(32).IsRequired();
            entity.Property(x => x.CodeHash).HasMaxLength(512).IsRequired();
            entity.HasIndex(x => new { x.PhoneNormalized, x.CreatedAt });
            entity.HasIndex(x => new { x.State, x.ExpiresAt });
        });

        modelBuilder.Entity<IdentitySessionRecord>(entity =>
        {
            entity.ToTable("sessions");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.UserId, x.State, x.LastSeenAt });
            entity.HasIndex(x => new { x.FamilyId, x.State });
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<IdentityRefreshTokenRecord>(entity =>
        {
            entity.ToTable("refresh_token_nodes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => new { x.FamilyId, x.ExpiresAt });
            entity.HasOne<IdentitySessionRecord>().WithMany().HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IdentityRoleRecord>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(200);
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<IdentityUserRoleRecord>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(x => new { x.UserId, x.RoleId });
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<IdentityRoleRecord>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuthAuditEventRecord>(entity =>
        {
            entity.ToTable("auth_audit_events");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Outcome).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Reason).HasMaxLength(100);
            entity.Property(x => x.CorrelationId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.SafeMetadata).HasMaxLength(1000);
            entity.HasIndex(x => new { x.UserId, x.OccurredAt });
            entity.HasIndex(x => new { x.EventType, x.OccurredAt });
            entity.HasIndex(x => x.CorrelationId);
        });

        modelBuilder.Entity<PoojaShopRecord>(entity =>
        {
            entity.ToTable("pooja_shops");
            entity.HasKey(shop => shop.Id);
            entity.Property(shop => shop.Name).HasMaxLength(200).IsRequired();
            entity.HasIndex(shop => shop.Name);
            entity.HasIndex(shop => shop.OwnerUserId);
            entity.HasOne<IdentityUserRecord>().WithMany().HasForeignKey(shop => shop.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductCategoryRecord>(entity =>
        {
            entity.ToTable("product_categories");
            entity.HasKey(category => category.Id);
            entity.Property(category => category.Name).HasMaxLength(100).IsRequired();
            entity.Property(category => category.Description).HasMaxLength(500);
            entity.HasIndex(category => category.Name).IsUnique();
            entity.HasIndex(category => new { category.IsActive, category.SortOrder });
        });

        modelBuilder.Entity<ProductRecord>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(product => product.Id);
            entity.Property(product => product.Name).HasMaxLength(200).IsRequired();
            entity.Property(product => product.Description).HasMaxLength(2000);
            entity.Property(product => product.Sku).HasMaxLength(100).IsRequired();
            entity.Property(product => product.Currency).HasMaxLength(3).IsRequired();
            entity.Property(product => product.ImageUrl).HasMaxLength(500);
            entity.Property(product => product.Price).HasPrecision(18, 2);
            entity.HasIndex(product => new { product.PoojaShopId, product.Sku }).IsUnique();
            entity.HasIndex(product => new { product.CategoryId, product.IsActive, product.IsAvailable });
            entity.HasOne(product => product.Shop).WithMany().HasForeignKey(product => product.PoojaShopId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(product => product.Category).WithMany().HasForeignKey(product => product.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}

public sealed class OutboxRecord
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTimeOffset OccurredAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public string? IdempotencyKey { get; set; }
}

public sealed class InboxRecord
{
    public Guid EventId { get; set; }
    public string Consumer { get; set; } = string.Empty;
    public DateTimeOffset ProcessedAt { get; set; }
}

public sealed class PoojaShopRecord
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class ProductCategoryRecord
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class ProductRecord
{
    public Guid Id { get; set; }
    public Guid PoojaShopId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "INR";
    public string Sku { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public bool IsAvailable { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public PoojaShopRecord Shop { get; set; } = null!;
    public ProductCategoryRecord Category { get; set; } = null!;
}
