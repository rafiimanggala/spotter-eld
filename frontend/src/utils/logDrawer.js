/**
 * FMCSA-compliant Driver's Daily Log Sheet — Canvas renderer
 * Canvas size: 1000 x 580
 */

const CANVAS_W = 1000
const CANVAS_H = 580

// Grid geometry
const GRID_LEFT = 80
const GRID_RIGHT = 930
const GRID_TOP = 100
const GRID_BOTTOM = 300
const GRID_W = GRID_RIGHT - GRID_LEFT // 850
const GRID_H = GRID_BOTTOM - GRID_TOP // 200
const ROW_H = GRID_H / 4 // 50px per row
const COL_W = GRID_W / 24 // ~35.4px per hour

const STATUS_MAP = {
  off_duty: 0,
  sleeper: 1,
  driving: 2,
  on_duty: 3,
}

const ROW_LABELS = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty (Not Driving)']

const HOUR_LABELS = [
  'Mid', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  'Noon', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'Mid',
]

function timeToX(decimalHours) {
  return GRID_LEFT + (decimalHours / 24) * GRID_W
}

function rowToY(rowIndex) {
  return GRID_TOP + rowIndex * ROW_H + ROW_H / 2
}

function parseTimeToDecimal(timeStr) {
  if (typeof timeStr === 'number') return timeStr
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  const hours = parseInt(parts[0], 10) || 0
  const minutes = parseInt(parts[1], 10) || 0
  return hours + minutes / 60
}

export function drawLogSheet(canvas, logData) {
  if (!canvas || !logData) return

  canvas.width = CANVAS_W
  canvas.height = CANVAS_H

  const ctx = canvas.getContext('2d')

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  drawHeader(ctx, logData)
  drawGrid(ctx)
  drawEntries(ctx, logData.entries || [])
  drawTotals(ctx, logData.entries || [])
  drawRemarks(ctx, logData.remarks || [], logData.entries || [])
  drawFooter(ctx, logData)
}

function drawHeader(ctx, logData) {
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText("DRIVER'S DAILY LOG", CANVAS_W / 2, 22)

  ctx.font = '10px Arial, sans-serif'
  ctx.fillText('(24-Hour Period)', CANVAS_W / 2, 36)

  // Header fields
  ctx.textAlign = 'left'
  ctx.font = '11px Arial, sans-serif'

  const date = logData.date || ''
  const totalMiles = logData.total_miles || logData.totalMiles || ''
  const carrier = logData.carrier || 'Transport Co.'
  const truckNum = logData.truck_number || logData.truckNumber || ''

  // Row 1
  ctx.fillText(`Date: ${date}`, 30, 55)
  ctx.fillText(`Total Miles Driven: ${totalMiles}`, 250, 55)
  ctx.fillText(`Carrier / Operator: ${carrier}`, 500, 55)

  // Row 2
  ctx.fillText(`Vehicle Numbers: ${truckNum}`, 30, 75)
  ctx.fillText(`Main Office Address: ___________________`, 250, 75)

  // Divider under header
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(20, 90)
  ctx.lineTo(CANVAS_W - 20, 90)
  ctx.stroke()
}

function drawGrid(ctx) {
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.5

  // Outer grid border
  ctx.strokeRect(GRID_LEFT, GRID_TOP, GRID_W, GRID_H)

  // Horizontal row dividers
  ctx.lineWidth = 1
  for (let r = 1; r < 4; r++) {
    const y = GRID_TOP + r * ROW_H
    ctx.beginPath()
    ctx.moveTo(GRID_LEFT, y)
    ctx.lineTo(GRID_RIGHT, y)
    ctx.stroke()
  }

  // Row labels on the left
  ctx.fillStyle = '#000000'
  ctx.font = '9px Arial, sans-serif'
  ctx.textAlign = 'right'
  for (let r = 0; r < 4; r++) {
    const y = rowToY(r)
    ctx.fillText(ROW_LABELS[r], GRID_LEFT - 4, y + 3)
  }

  // Row number labels (1-4) inside left edge
  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.textAlign = 'center'
  for (let r = 0; r < 4; r++) {
    const y = rowToY(r)
    ctx.fillText(`${r + 1}`, GRID_LEFT + 6, y + 4)
  }

  // Vertical hour lines + labels
  ctx.textAlign = 'center'
  ctx.font = '9px Arial, sans-serif'
  for (let h = 0; h <= 24; h++) {
    const x = timeToX(h)

    // Major hour line
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = h === 0 || h === 24 ? 1.5 : 0.8
    ctx.beginPath()
    ctx.moveTo(x, GRID_TOP)
    ctx.lineTo(x, GRID_BOTTOM)
    ctx.stroke()

    // Hour label on top
    ctx.fillStyle = '#000000'
    ctx.fillText(HOUR_LABELS[h], x, GRID_TOP - 4)

    // Quarter-hour ticks
    if (h < 24) {
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 0.3
      for (let q = 1; q < 4; q++) {
        const qx = timeToX(h + q * 0.25)
        ctx.beginPath()
        ctx.moveTo(qx, GRID_TOP)
        ctx.lineTo(qx, GRID_BOTTOM)
        ctx.stroke()
      }
    }
  }
}

function drawEntries(ctx, entries) {
  if (!entries || entries.length === 0) return

  ctx.strokeStyle = '#000000'
  ctx.fillStyle = '#000000'
  ctx.lineWidth = 2.5

  let prevX = null
  let prevY = null

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const rowIdx = STATUS_MAP[entry.status]
    if (rowIdx === undefined) continue

    const startH = parseTimeToDecimal(entry.start_time ?? entry.start)
    const endH = parseTimeToDecimal(entry.end_time ?? entry.end)

    const x1 = timeToX(startH)
    const x2 = timeToX(endH)
    const y = rowToY(rowIdx)

    // Vertical connecting line from previous entry
    if (prevX !== null && prevY !== null && prevY !== y) {
      ctx.beginPath()
      ctx.moveTo(x1, prevY)
      ctx.lineTo(x1, y)
      ctx.stroke()
    }

    // Dot at start
    ctx.beginPath()
    ctx.arc(x1, y, 3, 0, Math.PI * 2)
    ctx.fill()

    // Horizontal line
    ctx.beginPath()
    ctx.moveTo(x1, y)
    ctx.lineTo(x2, y)
    ctx.stroke()

    prevX = x2
    prevY = y
  }
}

function drawTotals(ctx, entries) {
  const totals = [0, 0, 0, 0] // off_duty, sleeper, driving, on_duty

  for (const entry of entries) {
    const rowIdx = STATUS_MAP[entry.status]
    if (rowIdx === undefined) continue
    const startH = parseTimeToDecimal(entry.start_time ?? entry.start)
    const endH = parseTimeToDecimal(entry.end_time ?? entry.end)
    totals[rowIdx] += endH - startH
  }

  // "Total" label
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Total', GRID_RIGHT + 8, GRID_TOP - 4)

  // Per-row totals
  ctx.font = 'bold 12px Arial, sans-serif'
  ctx.textAlign = 'center'
  for (let r = 0; r < 4; r++) {
    const y = rowToY(r)
    ctx.fillText(totals[r].toFixed(1), GRID_RIGHT + 30, y + 4)
  }

  // Sum line
  const sum = totals.reduce((a, b) => a + b, 0)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(GRID_RIGHT + 8, GRID_BOTTOM + 4)
  ctx.lineTo(GRID_RIGHT + 52, GRID_BOTTOM + 4)
  ctx.stroke()

  ctx.font = 'bold 13px Arial, sans-serif'
  ctx.fillText(sum.toFixed(1), GRID_RIGHT + 30, GRID_BOTTOM + 20)

  // Circle on-duty total (driving + on_duty)
  const onDutyTotal = totals[2] + totals[3]
  const circleX = GRID_RIGHT + 30
  const circleY = GRID_BOTTOM + 38
  ctx.font = 'bold 12px Arial, sans-serif'
  ctx.fillText(onDutyTotal.toFixed(1), circleX, circleY + 4)
  ctx.beginPath()
  ctx.arc(circleX, circleY, 16, 0, Math.PI * 2)
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.font = '8px Arial, sans-serif'
  ctx.fillText('On-Duty', circleX, circleY + 20)
}

function drawRemarks(ctx, remarks, entries) {
  // Remarks section background
  const remarkTop = 310
  const remarkBottom = 480
  const remarkH = remarkBottom - remarkTop

  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.strokeRect(GRID_LEFT, remarkTop, GRID_W, remarkH)

  // Label
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 11px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('Remarks', GRID_LEFT - 4, remarkTop + 14)

  // Draw grid lines in remarks (24 hours)
  ctx.strokeStyle = '#e5e5e5'
  ctx.lineWidth = 0.3
  for (let h = 1; h < 24; h++) {
    const x = timeToX(h)
    ctx.beginPath()
    ctx.moveTo(x, remarkTop)
    ctx.lineTo(x, remarkBottom)
    ctx.stroke()
  }

  // Draw remarks as diagonal text
  if (!remarks || remarks.length === 0) return

  ctx.fillStyle = '#000000'
  ctx.font = '9px Arial, sans-serif'
  ctx.textAlign = 'left'

  const usedPositions = []

  for (let i = 0; i < remarks.length; i++) {
    const remark = remarks[i]
    const time = parseTimeToDecimal(remark.time || remark.start_time || 0)
    let x = timeToX(time)

    // Avoid overlapping by shifting if too close
    for (const usedX of usedPositions) {
      if (Math.abs(x - usedX) < 25) {
        x += 25
      }
    }
    usedPositions.push(x)

    // Clamp x within remarks box
    x = Math.max(GRID_LEFT + 5, Math.min(x, GRID_RIGHT - 60))

    const y = remarkTop + 20 + (i % 6) * 24
    const text = remark.text || remark.location || `${remark.city || ''} - ${remark.activity || ''}`

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-Math.PI / 4)
    ctx.fillText(text.substring(0, 35), 0, 0)
    ctx.restore()
  }
}

function drawFooter(ctx, logData) {
  const footerY = 490

  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(20, footerY)
  ctx.lineTo(CANVAS_W - 20, footerY)
  ctx.stroke()

  ctx.fillStyle = '#000000'
  ctx.font = '10px Arial, sans-serif'
  ctx.textAlign = 'left'

  const shippingDoc = logData.shipping_doc || logData.shippingDoc || '___________________'

  ctx.fillText(`Shipping Document: ${shippingDoc}`, 30, footerY + 18)

  // Recap section
  ctx.font = 'bold 11px Arial, sans-serif'
  ctx.fillText('RECAP:', 500, footerY + 18)

  ctx.font = '10px Arial, sans-serif'
  const recap = logData.recap || {}

  // 7-day / 8-day recap table
  const recapX = 560
  ctx.fillText(`On-Duty Hours Today: ${(recap.on_duty_today || 0).toFixed(1)}`, recapX, footerY + 18)
  ctx.fillText(`Cycle Used: ${(recap.cycle_used || 0).toFixed(1)} / 70.0`, recapX, footerY + 34)
  ctx.fillText(`Cycle Remaining: ${(recap.cycle_remaining || 0).toFixed(1)}`, recapX, footerY + 50)

  // Signature line
  ctx.font = '10px Arial, sans-serif'
  ctx.fillText('Driver Signature: ___________________________', 30, footerY + 50)
  ctx.fillText('Date: ____________', 350, footerY + 50)

  // FMCSA notice
  ctx.font = '8px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#666666'
  ctx.fillText(
    'This log is generated in compliance with FMCSA Hours of Service regulations (49 CFR Part 395)',
    CANVAS_W / 2,
    CANVAS_H - 8,
  )
}
