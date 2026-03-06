// Abstract base class for metrics collection
export default abstract class MetricsBase {
    // Start metrics collection (optionally for a given duration in ms)
    public abstract start(ms?: number): void;

    // Stop metrics collection
    public abstract stop(): void;

    // Retrieve collected metrics
    public abstract getMetrics(): MemoryUsageType | TimeUsageType | CpuUsageType;
}

// Memory usage metrics type
type MemoryUsageType = {
    total: number;
    min: number;
    max: number;
    global_memory: number;
    global_free_memory: number;
};

// Time usage metrics type
type TimeUsageType = {
    startTime: string;
    endTime: string;
    duration: number;
};

// CPU usage metrics type
type CpuUsageType = {
    average: number;
    total: number;
    model: string;
    usage: number;
};

export type { MemoryUsageType, TimeUsageType, CpuUsageType };