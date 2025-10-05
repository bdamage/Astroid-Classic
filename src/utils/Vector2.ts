export interface Vector2 {
  x: number;
  y: number;
}

export class Vector2Utils {
  static create(x: number = 0, y: number = 0): Vector2 {
    return {x, y};
  }

  static add(a: Vector2, b: Vector2): Vector2 {
    return {x: a.x + b.x, y: a.y + b.y};
  }

  static subtract(a: Vector2, b: Vector2): Vector2 {
    return {x: a.x - b.x, y: a.y - b.y};
  }

  static multiply(v: Vector2, scalar: number): Vector2 {
    return {x: v.x * scalar, y: v.y * scalar};
  }

  static magnitude(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  static normalize(v: Vector2): Vector2 {
    const mag = Vector2Utils.magnitude(v);
    if (mag === 0) return {x: 0, y: 0};
    return {x: v.x / mag, y: v.y / mag};
  }

  static distance(a: Vector2, b: Vector2): number {
    return Vector2Utils.magnitude(Vector2Utils.subtract(a, b));
  }

  static fromAngle(angle: number, magnitude: number = 1): Vector2 {
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude,
    };
  }

  static rotate(v: Vector2, angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos,
    };
  }
}
