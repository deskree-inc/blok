# TASK-010: Additional Platform SDKs (C#, Python, PHP)
**Master Plan Reference**: Section 3.3 - Extended Platform Support  
**Dependencies**: TASK-003 (Multi-Platform SDK Ecosystem - TypeScript foundation)
**Estimated Effort**: L (3d) - Additional language SDKs building on established protocol
**Assigned To**: [To be assigned]
**Priority**: P2-Medium (Community expansion after core TypeScript ecosystem established)

## Business Value
Extend Blok's ecosystem reach to additional major programming languages, enabling developers from .NET, Python, and PHP communities to integrate Blok workflows as remote microservices without changing their existing technology stacks.

## Acceptance Criteria
- [ ] **C# SDK (.NET Core)**: Complete SDK with async/await, DI container support, and NuGet package
- [ ] **Python SDK**: Pythonic SDK with type hints, async support, and PyPI package  
- [ ] **PHP SDK**: Modern PHP SDK with PSR-4 autoloading and Composer package
- [ ] **Protocol Consistency**: All SDKs use identical remote node execution protocol from TASK-003
- [ ] **Framework Integration**: .NET DI, Python asyncio, PHP framework integrations
- [ ] **Package Publishing**: SDKs available via NuGet, PyPI, and Packagist
- [ ] **Documentation**: Complete usage examples and integration guides

## Business Queries to Validate
1. "Can a .NET Core backend integrate Blok Python AI nodes as microservices while maintaining C# business logic and Entity Framework workflows?"
2. "Can a Django/Flask application call Blok workflows for data processing while preserving Python application architecture?"
3. "Can a Laravel/Symfony application use Blok nodes for business logic processing with proper PHP error handling and logging?"

## Implementation Approach

### Phase 1: C# SDK (.NET Core)
**Target Directory**: `sdk/csharp/`

**Core Implementation**:
```csharp
// Main Classes
public class BlokClient
{
    private readonly HttpClient _httpClient;
    private readonly BlokClientConfig _config;
    
    public async Task<BlokResponse<T>> Python3Async<T>(string nodeName, object inputs);
    public async Task<BlokResponse<T>> NodeJsAsync<T>(string nodeName, object inputs, string type = "module");
    public async Task<BlokResponse<T>> CallAsync<T>(string runtime, string nodeName, object inputs);
}

// Dependency Injection Support
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBlokClient(
        this IServiceCollection services, 
        BlokClientConfig config);
}
```

### Phase 2: Python SDK
**Target Directory**: `sdk/python/`

**Core Implementation**:
```python
# Type-hinted async implementation
from typing import Optional, Dict, Any, TypeVar, Generic
import asyncio
import aiohttp

T = TypeVar('T')

class BlokClient:
    async def python3(self, node_name: str, inputs: Dict[str, Any]) -> BlokResponse[T]:
        """Execute Python3 node with type safety"""
        pass
    
    async def nodejs(self, node_name: str, inputs: Dict[str, Any], 
                    node_type: str = "module") -> BlokResponse[T]:
        """Execute Node.js node"""
        pass
    
    async def call(self, runtime: str, node_name: str, 
                  inputs: Dict[str, Any]) -> BlokResponse[T]:
        """Universal node execution"""
        pass

# Framework integrations
class DjangoBlokMiddleware:
    """Django integration middleware"""
    pass

class FastAPIBlokClient:
    """FastAPI dependency injection"""
    pass
```

### Phase 3: PHP SDK
**Target Directory**: `sdk/php/`

**Core Implementation**:
```php
<?php
namespace Blok\SDK;

use GuzzleHttp\Client as HttpClient;
use Psr\Http\Message\ResponseInterface;

class BlokClient
{
    private HttpClient $httpClient;
    private BlokClientConfig $config;
    
    public function python3(string $nodeName, array $inputs): BlokResponse
    {
        return $this->call('runtime.python3', $nodeName, $inputs);
    }
    
    public function nodejs(string $nodeName, array $inputs, string $type = 'module'): BlokResponse
    {
        return $this->call($type, $nodeName, $inputs);
    }
    
    public function call(string $runtime, string $nodeName, array $inputs): BlokResponse
    {
        // Implementation using established protocol from TASK-003
    }
}

// Framework integrations
class LaravelBlokServiceProvider extends ServiceProvider
{
    // Laravel integration
}

class SymfonyBlokBundle extends Bundle
{
    // Symfony integration
}
```

## Protocol Foundation (Built on TASK-003)
All SDKs will use the established remote node execution protocol:

**HTTP Request Pattern**:
```
POST {host}/{nodeName}
Headers:
  x-blok-execute-node: true
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
  {
    "Name": "{nodeName}",
    "Message": "{base64EncodedWorkflow}",
    "Encoding": "BASE64",
    "Type": "JSON"
  }
```

**Workflow Structure** (BASE64 encoded):
```json
{
  "request": {},
  "workflow": {
    "name": "Remote Node",
    "trigger": { "http": { "method": "POST", "path": "*" } },
    "steps": [{ "name": "node", "node": "{nodeName}", "type": "{runtime}" }],
    "nodes": { "node": { "inputs": {inputs} } }
  }
}
```

## Package Structure

### C# SDK Structure
```
sdk/csharp/
├── Blok.SDK/
│   ├── BlokClient.cs
│   ├── Models/
│   │   ├── BlokResponse.cs
│   │   ├── BlokError.cs
│   │   └── BlokClientConfig.cs
│   ├── Extensions/
│   │   └── ServiceCollectionExtensions.cs
│   └── Exceptions/
│       └── BlokSDKException.cs
├── Blok.SDK.Tests/
├── Examples/
│   ├── ConsoleApp/
│   ├── WebApi/
│   └── BlazorApp/
├── Blok.SDK.csproj
└── README.md
```

### Python SDK Structure
```
sdk/python/
├── blok_sdk/
│   ├── __init__.py
│   ├── client.py
│   ├── models.py
│   ├── exceptions.py
│   └── integrations/
│       ├── django.py
│       ├── fastapi.py
│       └── flask.py
├── tests/
├── examples/
│   ├── django_example/
│   ├── fastapi_example/
│   └── asyncio_example.py
├── setup.py
├── pyproject.toml
└── README.md
```

### PHP SDK Structure
```
sdk/php/
├── src/
│   ├── BlokClient.php
│   ├── Models/
│   │   ├── BlokResponse.php
│   │   ├── BlokError.php
│   │   └── BlokClientConfig.php
│   ├── Integrations/
│   │   ├── LaravelServiceProvider.php
│   │   └── SymfonyBundle.php
│   └── Exceptions/
│       └── BlokSDKException.php
├── tests/
├── examples/
│   ├── laravel/
│   ├── symfony/
│   └── vanilla/
├── composer.json
└── README.md
```

## Testing Strategy

### Language-Specific Testing
```csharp
// C# Integration Test
[Test]
public async Task CallAsync_ShouldIntegrateWithEntityFramework()
{
    // Arrange
    var blokClient = _serviceProvider.GetService<BlokClient>();
    var user = await _dbContext.Users.FirstAsync();
    
    // Act - Call Blok Python AI node
    var sentiment = await blokClient.Python3Async<SentimentResult>(
        "sentiment-analysis", 
        new { text = user.LastComment });
    
    // Assert - Update EF entity
    user.SentimentScore = sentiment.Data.Score;
    await _dbContext.SaveChangesAsync();
    
    Assert.IsTrue(sentiment.Success);
}
```

```python
# Python Integration Test
import asyncio
import pytest
from blok_sdk import BlokClient

@pytest.mark.asyncio
async def test_django_integration():
    """Test Blok integration with Django ORM"""
    client = BlokClient(host="http://localhost:4000")
    
    # Call Blok node from Django
    response = await client.python3("data-processor", {
        "user_id": 123,
        "processing_type": "advanced"
    })
    
    assert response.success
    assert response.data is not None
```

```php
// PHP Integration Test
use Blok\SDK\BlokClient;
use PHPUnit\Framework\TestCase;

class BlokClientTest extends TestCase
{
    public function testLaravelIntegration(): void
    {
        // Arrange
        $client = app(BlokClient::class);
        $user = User::find(1);
        
        // Act - Call Blok node
        $response = $client->python3('ml-prediction', [
            'user_data' => $user->toArray(),
            'model' => 'recommendation'
        ]);
        
        // Assert
        $this->assertTrue($response->success);
        $this->assertNotNull($response->data);
        
        // Update Laravel model
        $user->recommendation_score = $response->data['score'];
        $user->save();
    }
}
```

## Package Publishing

### NuGet Package (C#)
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <PackageId>Blok.SDK</PackageId>
    <Version>1.0.0</Version>
    <Description>Blok SDK for .NET Core - Remote workflow execution</Description>
    <PackageTags>blok;workflow;sdk;dotnet;remote-execution;ai;microservices</PackageTags>
    <Authors>Blok Framework Team</Authors>
    <RepositoryUrl>https://github.com/deskree-inc/blok</RepositoryUrl>
  </PropertyGroup>
</Project>
```

### PyPI Package (Python)
```toml
[project]
name = "blok-sdk"
version = "1.0.0"
description = "Blok SDK for Python - Remote workflow execution"
authors = [{name = "Blok Framework Team"}]
dependencies = ["aiohttp>=3.8.0", "pydantic>=2.0.0"]
keywords = ["blok", "workflow", "sdk", "python", "remote-execution", "ai", "microservices"]

[project.optional-dependencies]
django = ["django>=4.0.0"]
fastapi = ["fastapi>=0.95.0"]
flask = ["flask>=2.0.0"]
```

### Composer Package (PHP)
```json
{
    "name": "blok/sdk",
    "description": "Blok SDK for PHP - Remote workflow execution",
    "type": "library",
    "version": "1.0.0",
    "keywords": ["blok", "workflow", "sdk", "php", "remote-execution", "ai", "microservices"],
    "require": {
        "php": "^8.1",
        "guzzlehttp/guzzle": "^7.4",
        "psr/http-message": "^1.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0",
        "laravel/framework": "^10.0",
        "symfony/symfony": "^6.0"
    },
    "autoload": {
        "psr-4": {
            "Blok\\SDK\\": "src/"
        }
    }
}
```

## Success Metrics

### Technical Validation
- [ ] All SDKs execute nodes successfully using TASK-003 protocol
- [ ] Framework integrations work (DI containers, middleware, service providers)
- [ ] Error handling consistency across languages
- [ ] Performance within 10% variance of TypeScript SDKs

### Business Validation
- [ ] .NET applications can integrate Blok nodes as microservices
- [ ] Python applications maintain asyncio compatibility
- [ ] PHP applications work with modern framework patterns
- [ ] Cross-language workflows execute successfully

### Community Metrics
- [ ] Packages available on NuGet, PyPI, and Packagist
- [ ] Documentation covers framework-specific integration patterns
- [ ] Examples demonstrate real-world usage scenarios

## Implementation Timeline
- **Day 1**: C# SDK core implementation and testing
- **Day 2**: Python SDK with asyncio support and framework integrations  
- **Day 3**: PHP SDK with PSR compliance and package publishing

## Definition of Done
- [ ] All 3 additional SDKs implemented with protocol consistency
- [ ] Framework integrations tested and working
- [ ] Packages published to respective package managers
- [ ] Documentation includes language-specific examples
- [ ] Business queries validated with working examples
- [ ] Integration tests pass against real Blok deployment
- [ ] Community contribution guidelines established

---

**This task completes the multi-platform SDK ecosystem, enabling Blok integration from all major programming languages while building on the solid TypeScript foundation established in TASK-003.**
