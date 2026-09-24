using Dharma.Pandit.Application;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

/// <summary>
/// Read-only Pandit discovery backed by EF Core. All queries project to DTOs server-side, filter to
/// active/visible pandits and active services only, and page with Skip/Take so full entities are
/// never materialised. Never exposes internal identifiers or audit fields.
/// </summary>
public sealed class EfPanditQueryService(DharmaDbContext dbContext) : IPanditQueryService
{
    public async Task<PagedResult<PanditSummaryDto>> GetPanditsAsync(PanditQuery query, CancellationToken cancellationToken = default)
    {
        var pandits = dbContext.Pandits.AsNoTracking().Where(pandit => pandit.IsActive);

        if (query.City is not null)
        {
            var cityPattern = query.City;
            pandits = pandits.Where(pandit => pandit.City == cityPattern);
        }

        if (query.Service is not null)
        {
            var servicePattern = $"%{query.Service}%";
            pandits = pandits.Where(pandit => dbContext.PanditServices
                .Any(service => service.PanditId == pandit.Id && service.IsActive && EF.Functions.Like(service.Name, servicePattern)));
        }

        if (query.Search is not null)
        {
            var searchPattern = $"%{query.Search}%";
            pandits = pandits.Where(pandit => EF.Functions.Like(pandit.DisplayName, searchPattern) ||
                dbContext.PanditServices.Any(service => service.PanditId == pandit.Id && service.IsActive && EF.Functions.Like(service.Name, searchPattern)));
        }

        var totalCount = await pandits.CountAsync(cancellationToken);

        // Stable ordering: rating desc, then name, then id (tie-breaker) so pagination is deterministic.
        var items = await pandits
            .OrderByDescending(pandit => pandit.Rating)
            .ThenBy(pandit => pandit.DisplayName)
            .ThenBy(pandit => pandit.Id)
            .Skip(query.Skip)
            .Take(query.PageSize)
            .Select(pandit => new PanditSummaryDto(
                pandit.Id,
                pandit.DisplayName,
                pandit.ImageUrl,
                pandit.ShortDescription,
                pandit.ExperienceYears,
                pandit.City,
                pandit.State,
                pandit.Languages,
                pandit.Rating,
                pandit.ReviewCount,
                pandit.IsAvailable,
                dbContext.PanditServices
                    .Where(service => service.PanditId == pandit.Id && service.IsActive)
                    .OrderBy(service => service.Price)
                    .Select(service => service.Name)
                    .FirstOrDefault(),
                dbContext.PanditServices
                    .Where(service => service.PanditId == pandit.Id && service.IsActive)
                    .Select(service => (decimal?)service.Price)
                    .Min(),
                "INR"))
            .ToListAsync(cancellationToken);

        return new PagedResult<PanditSummaryDto>(items, query.Page, query.PageSize, totalCount);
    }

    public async Task<PanditDetailsDto?> GetPanditAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var pandit = await dbContext.Pandits.AsNoTracking()
            .Where(record => record.Id == id && record.IsActive)
            .Select(record => new
            {
                record.Id,
                record.DisplayName,
                record.ImageUrl,
                record.ShortDescription,
                record.ExperienceYears,
                record.City,
                record.State,
                record.Languages,
                record.Rating,
                record.ReviewCount,
                record.IsAvailable
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (pandit is null) return null;

        var services = await LoadActiveServicesAsync(id, cancellationToken);

        return new PanditDetailsDto(
            pandit.Id,
            pandit.DisplayName,
            pandit.ImageUrl,
            pandit.ShortDescription,
            pandit.ExperienceYears,
            pandit.City,
            pandit.State,
            pandit.Languages,
            pandit.Rating,
            pandit.ReviewCount,
            pandit.IsAvailable,
            services);
    }

    public async Task<IReadOnlyList<PanditServiceDto>?> GetPanditServicesAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exists = await dbContext.Pandits.AsNoTracking().AnyAsync(pandit => pandit.Id == id && pandit.IsActive, cancellationToken);
        if (!exists) return null;

        return await LoadActiveServicesAsync(id, cancellationToken);
    }

    private async Task<IReadOnlyList<PanditServiceDto>> LoadActiveServicesAsync(Guid panditId, CancellationToken cancellationToken) =>
        await dbContext.PanditServices.AsNoTracking()
            .Where(service => service.PanditId == panditId && service.IsActive)
            .OrderBy(service => service.Price)
            .ThenBy(service => service.Name)
            .Select(service => new PanditServiceDto(
                service.Id,
                service.Name,
                service.Description,
                service.DurationMinutes,
                service.Price,
                service.Currency))
            .ToListAsync(cancellationToken);
}
