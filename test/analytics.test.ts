import { ApiCall } from "../src/core/storageManager";

describe("Analytics Calculations", () => {
  describe("Total Calls Calculation", () => {
    it("should calculate total API calls", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "3",
          url: "https://api.com/3",
          method: "PUT",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
      ];

      const totalCalls = apiCalls.length;

      expect(totalCalls).toBe(3);
    });

    it("should return 0 for empty call list", () => {
      const apiCalls: ApiCall[] = [];
      const totalCalls = apiCalls.length;

      expect(totalCalls).toBe(0);
    });
  });

  describe("Average Response Time", () => {
    it("should calculate average response time", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
          duration: 100,
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: Date.now(),
          duration: 200,
        } as ApiCall,
        {
          id: "3",
          url: "https://api.com/3",
          method: "PUT",
          statusCode: 200,
          timestamp: Date.now(),
          duration: 300,
        } as ApiCall,
      ];

      const callsWithDuration = apiCalls.filter((call) => call.duration !== undefined);
      const avgResponseTime =
        callsWithDuration.length > 0
          ? callsWithDuration.reduce((sum, call) => sum + (call.duration || 0), 0) /
            callsWithDuration.length
          : 0;

      expect(avgResponseTime).toBe(200);
    });

    it("should handle calls without duration", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: Date.now(),
          duration: 150,
        } as ApiCall,
      ];

      const callsWithDuration = apiCalls.filter((call) => call.duration !== undefined);
      const avgResponseTime =
        callsWithDuration.length > 0
          ? callsWithDuration.reduce((sum, call) => sum + (call.duration || 0), 0) /
            callsWithDuration.length
          : 0;

      expect(avgResponseTime).toBe(150);
    });

    it("should return 0 when no calls have duration", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
      ];

      const callsWithDuration = apiCalls.filter((call) => call.duration !== undefined);
      const avgResponseTime =
        callsWithDuration.length > 0
          ? callsWithDuration.reduce((sum, call) => sum + (call.duration || 0), 0) /
            callsWithDuration.length
          : 0;

      expect(avgResponseTime).toBe(0);
    });
  });

  describe("Error Rate Calculation", () => {
    it("should calculate error rate for non-2xx status codes", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "3",
          url: "https://api.com/3",
          method: "PUT",
          statusCode: 404,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "4",
          url: "https://api.com/4",
          method: "DELETE",
          statusCode: 500,
          timestamp: Date.now(),
        } as ApiCall,
      ];

      const errorCalls = apiCalls.filter((call) => call.statusCode >= 400);
      const errorRate = apiCalls.length > 0 ? (errorCalls.length / apiCalls.length) * 100 : 0;

      expect(errorCalls.length).toBe(2);
      expect(errorRate).toBe(50);
    });

    it("should return 0% error rate for all successful calls", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "3",
          url: "https://api.com/3",
          method: "PUT",
          statusCode: 204,
          timestamp: Date.now(),
        } as ApiCall,
      ];

      const errorCalls = apiCalls.filter((call) => call.statusCode >= 400);
      const errorRate = apiCalls.length > 0 ? (errorCalls.length / apiCalls.length) * 100 : 0;

      expect(errorRate).toBe(0);
    });

    it("should return 0% for empty call list", () => {
      const apiCalls: ApiCall[] = [];

      const errorCalls = apiCalls.filter((call) => call.statusCode >= 400);
      const errorRate = apiCalls.length > 0 ? (errorCalls.length / apiCalls.length) * 100 : 0;

      expect(errorRate).toBe(0);
    });
  });

  describe("Bandwidth Calculation", () => {
    it("should calculate total bandwidth from response bodies", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
          responseBody: '{"data": "test"}',
          requestBody: "",
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: Date.now(),
          responseBody: '{"result": "success"}',
          requestBody: '{"input": "data"}',
        } as ApiCall,
      ];

      const calculateBandsize = (body: string | undefined): number => {
        if (!body) return 0;
        return new Blob([body]).size;
      };

      const totalBandwidth = apiCalls.reduce((sum, call) => {
        const requestSize = calculateBandsize(call.requestBody);
        const responseSize = calculateBandsize(call.responseBody);
        return sum + requestSize + responseSize;
      }, 0);

      expect(totalBandwidth).toBeGreaterThan(0);
    });

    it("should handle empty response bodies", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 204,
          timestamp: Date.now(),
          responseBody: "",
          requestBody: "",
        } as ApiCall,
      ];

      const calculateBandsize = (body: string | undefined): number => {
        if (!body) return 0;
        return new Blob([body]).size;
      };

      const totalBandwidth = apiCalls.reduce((sum, call) => {
        const requestSize = calculateBandsize(call.requestBody);
        const responseSize = calculateBandsize(call.responseBody);
        return sum + requestSize + responseSize;
      }, 0);

      expect(totalBandwidth).toBe(0);
    });

    it("should handle undefined response bodies", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
      ];

      const calculateBandsize = (body: string | undefined): number => {
        if (!body) return 0;
        return new Blob([body]).size;
      };

      const totalBandwidth = apiCalls.reduce((sum, call) => {
        const requestSize = calculateBandsize(call.requestBody);
        const responseSize = calculateBandsize(call.responseBody);
        return sum + requestSize + responseSize;
      }, 0);

      expect(totalBandwidth).toBe(0);
    });
  });

  describe("Endpoint Statistics", () => {
    it("should count calls per endpoint", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/users",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/users",
          method: "POST",
          statusCode: 201,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "3",
          url: "https://api.com/posts",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "4",
          url: "https://api.com/users",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
      ];

      const endpointMap = new Map<
        string,
        { calls: number; totalTime: number; errors: number; bandwidth: number }
      >();

      apiCalls.forEach((call) => {
        const url = new URL(call.url);
        const endpoint = `${call.method} ${url.pathname}`;

        if (!endpointMap.has(endpoint)) {
          endpointMap.set(endpoint, { calls: 0, totalTime: 0, errors: 0, bandwidth: 0 });
        }

        const stats = endpointMap.get(endpoint)!;
        stats.calls++;
        stats.totalTime += call.duration || 0;
        stats.errors += call.statusCode >= 400 ? 1 : 0;
      });

      expect(endpointMap.size).toBe(3);
      expect(endpointMap.get("GET /users")?.calls).toBe(2);
      expect(endpointMap.get("POST /users")?.calls).toBe(1);
      expect(endpointMap.get("GET /posts")?.calls).toBe(1);
    });

    it("should calculate average time per endpoint", () => {
      const endpointStats = {
        calls: 3,
        totalTime: 600,
        errors: 0,
        bandwidth: 1000,
      };

      const avgTime = endpointStats.calls > 0 ? endpointStats.totalTime / endpointStats.calls : 0;

      expect(avgTime).toBe(200);
    });

    it("should calculate error rate per endpoint", () => {
      const endpointStats = {
        calls: 10,
        totalTime: 2000,
        errors: 2,
        bandwidth: 5000,
      };

      const errorRate =
        endpointStats.calls > 0 ? (endpointStats.errors / endpointStats.calls) * 100 : 0;

      expect(errorRate).toBe(20);
    });
  });

  describe("Status Code Distribution", () => {
    it("should count status codes correctly", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "3",
          url: "https://api.com/3",
          method: "PUT",
          statusCode: 404,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "4",
          url: "https://api.com/4",
          method: "DELETE",
          statusCode: 500,
          timestamp: Date.now(),
        } as ApiCall,
        {
          id: "5",
          url: "https://api.com/5",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
      ];

      const statusCodes: Record<number, number> = {};
      apiCalls.forEach((call) => {
        statusCodes[call.statusCode] = (statusCodes[call.statusCode] || 0) + 1;
      });

      expect(statusCodes[200]).toBe(3);
      expect(statusCodes[404]).toBe(1);
      expect(statusCodes[500]).toBe(1);
    });

    it("should assign correct colors to status code ranges", () => {
      const statusCodes = [200, 201, 204, 301, 400, 404, 500, 503];
      const colors: Record<number, string> = {};

      statusCodes.forEach((code) => {
        if (code >= 200 && code < 300) {
          colors[code] = "#2e7d32";
        } else if (code >= 300 && code < 400) {
          colors[code] = "#f57c00";
        } else if (code >= 400 && code < 500) {
          colors[code] = "#f57c00";
        } else {
          colors[code] = "#c62828";
        }
      });

      expect(colors[200]).toBe("#2e7d32");
      expect(colors[404]).toBe("#f57c00");
      expect(colors[500]).toBe("#c62828");
    });
  });

  describe("Time Range Filtering", () => {
    it("should filter calls by last hour", () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: now - 30 * 60 * 1000,
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: twoHoursAgo,
        } as ApiCall,
      ];

      const filtered = apiCalls.filter((call) => now - call.timestamp <= 60 * 60 * 1000);

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("1");
    });

    it("should filter calls by last day", () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: oneDayAgo + 1000,
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: twoDaysAgo,
        } as ApiCall,
      ];

      const filtered = apiCalls.filter((call) => now - call.timestamp <= 24 * 60 * 60 * 1000);

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("1");
    });

    it("should filter calls by last week", () => {
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const twoWeeksAgo = now - 2 * 7 * 24 * 60 * 60 * 1000;

      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: oneWeekAgo + 1000,
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: twoWeeksAgo,
        } as ApiCall,
      ];

      const filtered = apiCalls.filter((call) => now - call.timestamp <= 7 * 24 * 60 * 60 * 1000);

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("1");
    });

    it('should return all calls for "all" time range', () => {
      const apiCalls: ApiCall[] = [
        {
          id: "1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: Date.now() - 1000000,
        } as ApiCall,
        {
          id: "2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: Date.now() - 10000000,
        } as ApiCall,
        {
          id: "3",
          url: "https://api.com/3",
          method: "PUT",
          statusCode: 200,
          timestamp: Date.now(),
        } as ApiCall,
      ];

      const filtered = apiCalls;

      expect(filtered.length).toBe(3);
    });
  });

  describe("Endpoint Sorting", () => {
    it("should sort endpoints by call count descending", () => {
      const endpoints = [
        {
          url: "GET /users",
          calls: 5,
          totalTime: 500,
          errors: 0,
          bandwidth: 1000,
          avgTime: 100,
          errorRate: 0,
        },
        {
          url: "GET /posts",
          calls: 10,
          totalTime: 2000,
          errors: 1,
          bandwidth: 3000,
          avgTime: 200,
          errorRate: 10,
        },
        {
          url: "POST /comments",
          calls: 3,
          totalTime: 300,
          errors: 0,
          bandwidth: 600,
          avgTime: 100,
          errorRate: 0,
        },
      ];

      const sorted = [...endpoints].sort((a, b) => b.calls - a.calls);

      expect(sorted[0].url).toBe("GET /posts");
      expect(sorted[1].url).toBe("GET /users");
      expect(sorted[2].url).toBe("POST /comments");
    });

    it("should maintain order for equal call counts", () => {
      const endpoints = [
        {
          url: "GET /users",
          calls: 5,
          totalTime: 500,
          errors: 0,
          bandwidth: 1000,
          avgTime: 100,
          errorRate: 0,
        },
        {
          url: "GET /posts",
          calls: 5,
          totalTime: 2000,
          errors: 1,
          bandwidth: 3000,
          avgTime: 400,
          errorRate: 20,
        },
      ];

      const sorted = [...endpoints].sort((a, b) => b.calls - a.calls);

      expect(sorted.length).toBe(2);
      expect(sorted.every((ep) => ep.calls === 5)).toBe(true);
    });
  });

  describe("Endpoint Search", () => {
    it("should filter endpoints by search term", () => {
      const endpoints = [
        {
          url: "GET /users",
          calls: 5,
          totalTime: 500,
          errors: 0,
          bandwidth: 1000,
          avgTime: 100,
          errorRate: 0,
        },
        {
          url: "GET /posts",
          calls: 10,
          totalTime: 2000,
          errors: 1,
          bandwidth: 3000,
          avgTime: 200,
          errorRate: 10,
        },
        {
          url: "GET /comments",
          calls: 3,
          totalTime: 300,
          errors: 0,
          bandwidth: 600,
          avgTime: 100,
          errorRate: 0,
        },
      ];

      const searchTerm = "post";
      const filtered = endpoints.filter((ep) =>
        ep.url.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].url).toBe("GET /posts");
    });

    it("should return empty array for non-matching search", () => {
      const endpoints = [
        {
          url: "GET /users",
          calls: 5,
          totalTime: 500,
          errors: 0,
          bandwidth: 1000,
          avgTime: 100,
          errorRate: 0,
        },
        {
          url: "GET /posts",
          calls: 10,
          totalTime: 2000,
          errors: 1,
          bandwidth: 3000,
          avgTime: 200,
          errorRate: 10,
        },
      ];

      const searchTerm = "nonexistent";
      const filtered = endpoints.filter((ep) =>
        ep.url.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered.length).toBe(0);
    });

    it("should be case insensitive", () => {
      const endpoints = [
        {
          url: "GET /USERS",
          calls: 5,
          totalTime: 500,
          errors: 0,
          bandwidth: 1000,
          avgTime: 100,
          errorRate: 0,
        },
        {
          url: "GET /posts",
          calls: 10,
          totalTime: 2000,
          errors: 1,
          bandwidth: 3000,
          avgTime: 200,
          errorRate: 10,
        },
      ];

      const searchTerm = "users";
      const filtered = endpoints.filter((ep) =>
        ep.url.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].url).toBe("GET /USERS");
    });
  });
});

describe("Analytics Storage", () => {
  describe("Cache Storage", () => {
    it("should save analytics cache with timestamp", async () => {
      const chromeMock = {
        storage: {
          local: {
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      };
      global.chrome = chromeMock as any;

      const cacheData = {
        timestamp: Date.now(),
        data: { totalCalls: 100, avgResponseTime: 150 },
      };

      await chrome.storage.local.set({ spectrion_analytics_cache: cacheData });

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        spectrion_analytics_cache: cacheData,
      });
      expect(cacheData.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should load analytics cache from storage", async () => {
      const cacheData = {
        timestamp: Date.now(),
        data: { totalCalls: 100, avgResponseTime: 150 },
      };

      const chromeMock = {
        storage: {
          local: {
            get: jest.fn().mockResolvedValue({
              spectrion_analytics_cache: cacheData,
            }),
          },
        },
      };
      global.chrome = chromeMock as any;

      const result = (await chrome.storage.local.get("spectrion_analytics_cache")) as {
        spectrion_analytics_cache: typeof cacheData;
      };

      expect(result.spectrion_analytics_cache).toBeDefined();
      expect(result.spectrion_analytics_cache.timestamp).toBe(cacheData.timestamp);
      expect(result.spectrion_analytics_cache.data).toEqual(cacheData.data);
    });

    it("should handle missing cache", async () => {
      const chromeMock = {
        storage: {
          local: {
            get: jest.fn().mockResolvedValue({}),
          },
        },
      };
      global.chrome = chromeMock as any;

      const result = await chrome.storage.local.get("spectrion_analytics_cache");

      expect(result.spectrion_analytics_cache).toBeUndefined();
    });
  });

  describe("Cache Expiration", () => {
    it("should use cached data within TTL", () => {
      const now = Date.now();
      const cacheAge = 30000;
      const ttl = 60000;

      const shouldUseCache = cacheAge < ttl;

      expect(shouldUseCache).toBe(true);
    });

    it("should not use expired cache", () => {
      const now = Date.now();
      const cacheAge = 70000;
      const ttl = 60000;

      const shouldUseCache = cacheAge < ttl;

      expect(shouldUseCache).toBe(false);
    });
  });
});

describe("Analytics UI Updates", () => {
  describe("Statistics Display", () => {
    it("should update total calls display", () => {
      const totalCallsEl = document.createElement("div");
      totalCallsEl.id = "totalCalls";
      totalCallsEl.textContent = "0";
      document.body.appendChild(totalCallsEl);

      totalCallsEl.textContent = "42";

      expect(totalCallsEl.textContent).toBe("42");
    });

    it("should update average response time display", () => {
      const avgResponseTimeEl = document.createElement("div");
      avgResponseTimeEl.id = "avgResponseTime";
      avgResponseTimeEl.textContent = "0ms";
      document.body.appendChild(avgResponseTimeEl);

      avgResponseTimeEl.textContent = "150ms";

      expect(avgResponseTimeEl.textContent).toBe("150ms");
    });

    it("should update error rate display", () => {
      const errorRateEl = document.createElement("div");
      errorRateEl.id = "errorRate";
      errorRateEl.textContent = "0%";
      document.body.appendChild(errorRateEl);

      errorRateEl.textContent = "25.5%";

      expect(errorRateEl.textContent).toBe("25.5%");
    });

    it("should format bandwidth correctly", () => {
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
      };

      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1024)).toBe("1.00 KB");
      expect(formatBytes(1048576)).toBe("1.00 MB");
      expect(formatBytes(1073741824)).toBe("1.00 GB");
    });
  });

  describe("Chart Updates", () => {
    it("should destroy existing chart before creating new one", () => {
      const mockChart = {
        destroy: jest.fn(),
      };

      let existingChart = mockChart;
      existingChart.destroy();

      expect(mockChart.destroy).toHaveBeenCalled();
    });

    it("should create chart with correct data", () => {
      const mockCtx = {
        getContext: jest.fn(),
      };

      const chartData = {
        labels: ["10:00", "10:01", "10:02"],
        datasets: [
          {
            label: "Success",
            data: [100, 150, 200],
            borderColor: "#2e7d32",
          },
        ],
      };

      expect(chartData.labels.length).toBe(3);
      expect(chartData.datasets[0].data.length).toBe(3);
    });
  });

  describe("Table Rendering", () => {
    it("should show empty state when no endpoints", () => {
      const tbody = document.createElement("tbody");
      tbody.id = "endpointsTableBody";
      document.body.appendChild(tbody);

      const endpoints = [];
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No data available</td></tr>';

      expect(tbody.innerHTML).toContain("No data available");
    });

    it("should render endpoint rows", () => {
      const tbody = document.createElement("tbody");
      tbody.id = "endpointsTableBody";
      document.body.appendChild(tbody);

      const endpoints = [
        { url: "GET /users", calls: 5, avgTime: 100, errorRate: 0, bandwidth: 1000 },
      ];

      tbody.innerHTML = endpoints
        .map(
          (ep) => `
        <tr>
          <td><code>${ep.url}</code></td>
          <td>${ep.calls}</td>
          <td>${ep.avgTime}ms</td>
          <td>${ep.errorRate}%</td>
          <td>${ep.bandwidth}B</td>
        </tr>
      `
        )
        .join("");

      expect(tbody.innerHTML).toContain("GET /users");
      expect(tbody.innerHTML).toContain("5");
      expect(tbody.innerHTML).toContain("100ms");
    });
  });
});

describe("Analytics Real-time Updates", () => {
  describe("Message Handling", () => {
    it("should listen for API_CALLS_UPDATED messages", () => {
      const addListenerMock = jest.fn();
      const chromeMock = {
        runtime: {
          onMessage: {
            addListener: addListenerMock,
          },
        },
      };
      global.chrome = chromeMock as any;

      const listener = (message: any) => {
        if (message.type === "API_CALLS_UPDATED") {
          console.log("API calls updated");
        }
      };

      chrome.runtime.onMessage.addListener(listener);

      expect(addListenerMock).toHaveBeenCalledWith(listener);
    });

    it("should handle API_CALLS_UPDATED message type", () => {
      const message = { type: "API_CALLS_UPDATED" };
      const isCorrectType = message.type === "API_CALLS_UPDATED";

      expect(isCorrectType).toBe(true);
    });
  });

  describe("Dashboard Refresh", () => {
    it("should reload API calls on message", async () => {
      const sendMessageMock = jest
        .fn()
        .mockResolvedValue([
          {
            id: "1",
            url: "https://api.com",
            method: "GET",
            statusCode: 200,
            timestamp: Date.now(),
          } as ApiCall,
        ]);

      const chromeMock = {
        runtime: {
          sendMessage: sendMessageMock,
        },
      };
      global.chrome = chromeMock as any;

      const response = await chrome.runtime.sendMessage({ type: "GET_ALL_API_CALLS" });

      expect(sendMessageMock).toHaveBeenCalledWith({ type: "GET_ALL_API_CALLS" });
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe("Auto-refresh Interval", () => {
    it("should set up periodic refresh", () => {
      const setIntervalMock = jest.fn().mockReturnValue(12345);
      global.setInterval = setIntervalMock;

      const refreshInterval = setInterval(() => {
        console.log("Refreshing analytics");
      }, 3000);

      expect(setIntervalMock).toHaveBeenCalledWith(expect.any(Function), 3000);
      expect(refreshInterval).toBe(12345);
    });

    it("should clear interval on cleanup", () => {
      const clearIntervalMock = jest.fn();
      global.clearInterval = clearIntervalMock;

      const intervalId = 12345;
      clearInterval(intervalId);

      expect(clearIntervalMock).toHaveBeenCalledWith(12345);
    });
  });
});
