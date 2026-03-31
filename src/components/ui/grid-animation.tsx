"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { motion, useAnimate } from "framer-motion"
import { cn } from "@/lib/utils"

interface GridAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: number
  strokeLength?: number
  strokeWidth?: number
  fillParent?: boolean
}

export function GridAnimation({
  className,
  spacing = 30,
  strokeLength = 10,
  strokeWidth = 1,
  fillParent = true,
  ...props
}: GridAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ballRef, animate] = useAnimate()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const animationFrameRef = useRef<number | null>(null)
  const isMouseOverRef = useRef(false)
  const currentBallPosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!fillParent || !containerRef.current) return

    const updateSize = () => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      setDimensions({ width, height })

      const centerX = width / 2
      const centerY = height / 2
      currentBallPosition.current = { x: centerX, y: centerY }

      if (ballRef.current) {
        animate(ballRef.current, { x: centerX, y: centerY }, { duration: 0 })
      }
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [fillParent, spacing, ballRef, animate])

  const cols = Math.ceil(dimensions.width / spacing)
  const rows = Math.ceil(dimensions.height / spacing)

  const snapToGrid = (pointX: number, pointY: number) => {
    const nearestX = Math.round(pointX / spacing) * spacing
    const nearestY = Math.round(pointY / spacing) * spacing
    return { x: nearestX, y: nearestY }
  }

  const animateCanvas = useCallback(() => {
    if (!canvasRef.current || dimensions.width === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    const ballX = currentBallPosition.current.x
    const ballY = currentBallPosition.current.y

    const foregroundColor = "rgba(15, 52, 96, 0.5)"

    for (let col = 0; col <= cols; col++) {
      for (let row = 0; row <= rows; row++) {
        const pointX = col * spacing
        const pointY = row * spacing
        const dx = ballX - pointX
        const dy = ballY - pointY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 15) continue

        const angle = Math.atan2(dy, dx)

        ctx.beginPath()
        ctx.moveTo(pointX, pointY)
        ctx.lineTo(pointX - Math.cos(angle) * strokeLength, pointY - Math.sin(angle) * strokeLength)
        ctx.strokeStyle = foregroundColor
        ctx.lineWidth = strokeWidth
        ctx.stroke()
      }
    }

    if (isMouseOverRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateCanvas)
    }
  }, [dimensions, cols, rows, spacing, strokeLength, strokeWidth])

  const startAnimationLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    isMouseOverRef.current = true
    animationFrameRef.current = requestAnimationFrame(animateCanvas)
  }, [animateCanvas])

  const stopAnimationLoop = useCallback(() => {
    isMouseOverRef.current = false
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    requestAnimationFrame(animateCanvas)
  }, [animateCanvas])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const { x: snapX, y: snapY } = snapToGrid(mouseX, mouseY)

    currentBallPosition.current = { x: snapX, y: snapY }

    animate(
      ballRef.current,
      { x: snapX, y: snapY },
      { type: "spring", stiffness: 300, damping: 20 },
    )
  }

  const handleMouseEnter = () => {
    startAnimationLoop()
  }

  const handleMouseLeave = () => {
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2

    currentBallPosition.current = { x: centerX, y: centerY }

    animate(
      ballRef.current,
      { x: centerX, y: centerY },
      { type: "spring", stiffness: 300, damping: 20 },
    )

    stopAnimationLoop()
  }

  useEffect(() => {
    if (canvasRef.current) {
      requestAnimationFrame(animateCanvas)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animateCanvas])

  return (
    <div
      ref={containerRef}
      className={cn("relative cursor-pointer", fillParent && "w-full h-full", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <>
          <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0" />
          <motion.div
            ref={ballRef}
            className="absolute w-2 h-2 rounded-full bg-[#0F3460]"
            style={{
              x: 0,
              y: 0,
              marginLeft: -4,
              marginTop: -4,
            }}
          />
        </>
      )}
    </div>
  )
}
