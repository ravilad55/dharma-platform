using System.Xml.Linq;
using FluentAssertions;

namespace Dharma.Architecture.Tests;

public sealed class DependencyRulesTests
{
    private static readonly string[] Modules =
    ["Identity", "Customer", "Pandit", "PoojaSamagri", "Restaurant", "Delivery", "Booking", "Order", "Payment", "Notification"];

    [Fact]
    public void EveryModuleHasExplicitLayers()
    {
        foreach (var module in Modules)
        {
            File.Exists(ProjectPath(module, "Domain")).Should().BeTrue();
            File.Exists(ProjectPath(module, "Application")).Should().BeTrue();
            File.Exists(ProjectPath(module, "Infrastructure")).Should().BeTrue();
        }
    }

    [Fact]
    public void DomainProjectsHaveNoOutwardDependencies()
    {
        foreach (var module in Modules)
        {
            References(ProjectPath(module, "Domain")).Should().NotContain(reference =>
                reference.Contains("Application", StringComparison.OrdinalIgnoreCase) ||
                reference.Contains("Infrastructure", StringComparison.OrdinalIgnoreCase) ||
                reference.Contains("Dharma.Api", StringComparison.OrdinalIgnoreCase));
        }
    }

    [Fact]
    public void ApplicationProjectsReferenceOnlyTheirDomain()
    {
        foreach (var module in Modules)
        {
            var references = References(ProjectPath(module, "Application"));
            references.Should().OnlyContain(reference =>
                reference.EndsWith($"Dharma.{module}.Domain.csproj", StringComparison.OrdinalIgnoreCase) ||
                reference.EndsWith("Dharma.Shared.csproj", StringComparison.OrdinalIgnoreCase));
        }
    }

    [Fact]
    public void InfrastructureProjectsReferenceOnlyTheirModuleLayersAndSharedContracts()
    {
        foreach (var module in Modules)
        {
            var references = References(ProjectPath(module, "Infrastructure"));
            references.Should().OnlyContain(reference =>
                reference.EndsWith($"Dharma.{module}.Application.csproj", StringComparison.OrdinalIgnoreCase) ||
                reference.EndsWith($"Dharma.{module}.Domain.csproj", StringComparison.OrdinalIgnoreCase) ||
                reference.EndsWith("Dharma.Shared.csproj", StringComparison.OrdinalIgnoreCase));
        }
    }

    [Fact]
    public void ApiIsLimitedToApplicationAndCompositionInfrastructureReferences()
    {
        var references = References(Path.Combine(BackendRoot(), "src", "Dharma.Api", "Dharma.Api.csproj"));
        references.Should().OnlyContain(reference =>
            reference.Contains("\\Application\\", StringComparison.OrdinalIgnoreCase) ||
            reference.EndsWith("Dharma.Infrastructure.csproj", StringComparison.OrdinalIgnoreCase));
    }

    private static string ProjectPath(string module, string layer) =>
        Path.Combine(BackendRoot(), "src", module, layer, $"Dharma.{module}.{layer}.csproj");

    private static string[] References(string projectPath) =>
        XDocument.Load(projectPath)
            .Descendants("ProjectReference")
            .Select(element => (string?)element.Attribute("Include") ?? string.Empty)
            .ToArray();

    private static string BackendRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "Dharma.sln")))
        {
            directory = directory.Parent;
        }

        return directory?.FullName ?? throw new DirectoryNotFoundException("Could not locate backend solution.");
    }
}
