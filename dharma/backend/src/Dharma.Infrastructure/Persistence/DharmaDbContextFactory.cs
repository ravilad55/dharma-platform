using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Dharma.Infrastructure.Persistence;

public sealed class DharmaDbContextFactory : IDesignTimeDbContextFactory<DharmaDbContext>
{
    public DharmaDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("CONNECTIONSTRINGS__DEFAULT")
            ?? "Server=localhost;Port=3306;Database=dharma;User=dharma;Password=dharma_local;";
        var options = new DbContextOptionsBuilder<DharmaDbContext>()
            .UseMySql(connectionString, new MySqlServerVersion(new Version(8, 4, 0)))
            .Options;
        return new DharmaDbContext(options);
    }
}
