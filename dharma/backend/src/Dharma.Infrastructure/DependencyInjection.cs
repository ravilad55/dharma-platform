using Dharma.Infrastructure.Messaging;
using Dharma.Infrastructure.Persistence;
using Dharma.Infrastructure.Redis;
using Dharma.Identity.Application;
using Dharma.Identity.Infrastructure;
using Dharma.PoojaSamagri.Application;
using Dharma.Order.Application;
using Dharma.Customer.Application;
using Dharma.SharedKernel.Abstractions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace Dharma.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddDharmaInfrastructure(this IServiceCollection services, IConfiguration configuration, Microsoft.Extensions.Hosting.IHostEnvironment environment)
    {
        services.AddIdentityInfrastructure(configuration, environment);
        services.AddScoped<ICatalogQueryService, PoojaSamagriCatalogQueryService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<ICartStore, EfCartStore>();
        services.AddScoped<IOrderCartRevalidationStore, EfCartStore>();
        services.AddScoped<IOrderCartRevalidationService, OrderCartRevalidationService>();
        services.AddScoped<IOrderCheckoutStore, EfOrderCheckoutStore>();
        services.AddScoped<IOrderAddressSnapshotSource, EfOrderCheckoutStore>();
        services.AddScoped<IOrderCheckoutService, OrderCheckoutService>();
        services.AddScoped<IOrderHistoryStore, EfOrderHistoryStore>();
        services.AddScoped<IOrderHistoryService, OrderHistoryService>();
        services.AddScoped<IAddressService, AddressService>();
        services.AddScoped<IAddressStore, EfAddressStore>();
        var connectionString = configuration.GetConnectionString("Default");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            services.AddDbContext<DharmaDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
            services.AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<DharmaDbContext>());
            services.AddScoped<ITransactionBoundary, EfTransactionBoundary>();
            services.AddScoped<IOutboxStore, EfOutboxStore>();
            services.AddScoped<IEventPublisher, JsonEventPublisher>();
            services.AddScoped<IIdentityStore, EfIdentityStore>();
            services.AddScoped<IAuditPublisher, EfAuditPublisher>();
        }

        var redisConnection = configuration["Redis:ConnectionString"];
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnection));
            services.AddSingleton<ICache, RedisCache>();
            services.AddSingleton<IDistributedLock, RedisDistributedLock>();
            services.AddSingleton<IAuthRateLimiter, RedisAuthRateLimiter>();
        }

        return services;
    }

}
