"use client"

import { useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface MagneticDotGridProps {
  className?: string
  children?: React.ReactNode
  gap?: number
  dotSize?: number
  baseColor?: string
  radius?: number
  strength?: number
}

interface DotNode {
  homeX: number
  homeY: number
  currX: number
  currY: number
}

/**
 * A magnetic dot grid component that smoothly diverges (repels) dots away from the cursor
 * without changing dot colors.
 */
export function DotField({
  className,
  children,
  gap = 24,
  dotSize = 1.5,
  baseColor = "rgba(100, 116, 139, 0.4)",
  radius = 150,
  strength = 28,
}: MagneticDotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<DotNode[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animFrameRef = useRef<number | null>(null)

  const initGrid = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const cols = Math.ceil(rect.width / gap) + 1
    const rows = Math.ceil(rect.height / gap) + 1

    const offsetX = (rect.width - (cols - 1) * gap) / 2
    const offsetY = (rect.height - (rows - 1) * gap) / 2

    const newDots: DotNode[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * gap
        const y = offsetY + r * gap
        newDots.push({
          homeX: x,
          homeY: y,
          currX: x,
          currY: y,
        })
      }
    }
    dotsRef.current = newDots
  }, [gap])

  useEffect(() => {
    initGrid()
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(initGrid)
    ro.observe(container)
    return () => ro.disconnect()
  }, [initGrid])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const radSq = radius * radius

      ctx.fillStyle = baseColor

      for (let i = 0; i < dotsRef.current.length; i++) {
        const dot = dotsRef.current[i]
        const dx = mx - dot.homeX
        const dy = my - dot.homeY
        const distSq = dx * dx + dy * dy

        let targetX = dot.homeX
        let targetY = dot.homeY

        if (distSq < radSq && distSq > 0) {
          const dist = Math.sqrt(distSq)
          const activeRatio = 1 - dist / radius
          // Diverging / repelling push away from cursor
          const push = activeRatio * strength
          targetX = dot.homeX - (dx / dist) * push
          targetY = dot.homeY - (dy / dist) * push
        }

        // Smooth spring movement (lerp)
        dot.currX += (targetX - dot.currX) * 0.18
        dot.currY += (targetY - dot.currY) * 0.18

        // Draw dot maintaining exact original color and size
        ctx.beginPath()
        ctx.arc(dot.currX * dpr, dot.currY * dpr, dotSize * dpr, 0, Math.PI * 2)
        ctx.fill()
      }

      animFrameRef.current = requestAnimationFrame(draw)
    }

    animFrameRef.current = requestAnimationFrame(draw)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [dotSize, baseColor, radius, strength])

  return (
    <div ref={containerRef} className={cn("relative w-full h-full min-h-full overflow-hidden", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none block" />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  )
}

export function DotPattern({
  className,
  baseColor,
  proximity,
}: {
  className?: string
  baseColor?: string
  glowColor?: string
  proximity?: number
  glowIntensity?: number
  waveSpeed?: number
}) {
  return (
    <div className={cn("fixed inset-0 z-0 pointer-events-none overflow-hidden w-full h-full", className)}>
      <DotField
        baseColor={baseColor || "rgba(100, 116, 139, 0.4)"}
        radius={proximity || 150}
        strength={28}
        className="h-full w-full"
      />
    </div>
  )
}

export default DotField
