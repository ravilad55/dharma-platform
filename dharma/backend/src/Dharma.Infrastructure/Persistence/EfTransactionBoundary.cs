using Dharma.SharedKernel.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class EfTransactionBoundary(DharmaDbContext dbContext) : ITransactionBoundary
{
    public async Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await action(cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
