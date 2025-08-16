/**
 * Circuit Breaker implementation for external API calls
 * Prevents cascading failures and provides graceful degradation
 */

export interface CircuitBreakerOptions {
  /** Failure threshold before opening circuit */
  failureThreshold: number;
  /** Reset timeout in milliseconds */
  resetTimeout: number;
  /** Monitor window in milliseconds */
  monitoringPeriod: number;
  /** Expected threshold for successful calls */
  expectedThreshold: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  requests: number;
  nextAttempt?: number;
}

/**
 * Circuit Breaker for protecting external service calls
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private requests = 0;
  private nextAttempt = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      expectedThreshold: 0.5,
      ...options,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
      }

      // Move to half-open state
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successes++;
    this.requests++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Reset circuit after successful call in half-open state
      this.reset();
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.requests++;

    const failureRate = this.failures / this.requests;

    if (
      this.state === CircuitState.CLOSED &&
      this.failures >= this.options.failureThreshold &&
      failureRate > 1 - this.options.expectedThreshold
    ) {
      this.trip();
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Return to open state on failure in half-open
      this.trip();
    }
  }

  /**
   * Trip the circuit breaker (move to OPEN state)
   */
  private trip(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.resetTimeout;
  }

  /**
   * Reset the circuit breaker to CLOSED state
   */
  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.requests = 0;
    this.nextAttempt = 0;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requests: this.requests,
      nextAttempt: this.nextAttempt > 0 ? this.nextAttempt : undefined,
    };
  }

  /**
   * Check if the circuit breaker allows requests
   */
  isAvailable(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttempt) {
      return true;
    }

    return false;
  }

  /**
   * Manually reset the circuit breaker
   */
  manualReset(): void {
    this.reset();
  }
}
