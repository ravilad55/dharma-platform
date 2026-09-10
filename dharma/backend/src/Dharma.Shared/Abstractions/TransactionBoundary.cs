namespace Dharma.SharedKernel.Abstractions;

public interface ITransactionBoundary
{
    Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default);
}
