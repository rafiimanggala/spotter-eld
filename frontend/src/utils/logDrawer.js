/**
 * FMCSA-compliant Driver's Daily Log Sheet — Canvas renderer
 * Matches DOT Form 395.1 layout
 * Canvas size: 1000 x 700
 */

const CANVAS_W = 1000
const CANVAS_H = 700

// Grid geometry
const GRID_LEFT = 80
const GRID_RIGHT = 920
const GRID_TOP = 135
const GRID_BOTTOM = 335
const GRID_W = GRID_RIGHT - GRID_LEFT
const GRID_H = GRID_BOTTOM - GRID_TOP
const ROW_H = GRID_H / 4
const COL_W = GRID_W / 24

const STATUS_MAP = {
  off_duty: 0,
  sleeper: 1,
  driving: 2,
  on_duty: 3,
}

const ROW_LABELS = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty (Not Driving)']

const HOUR_LABELS = [
  'Mid-\nnight', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  'Noon', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'Mid-\nnight',
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

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function parseDateParts(dateStr) {
  if (!dateStr) return { month: '', day: '', year: '' }
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return {
      month: String(d.getMonth() + 1).padStart(2, '0'),
      day: String(d.getDate()).padStart(2, '0'),
      year: String(d.getFullYear()),
    }
  } catch {
    return { month: '', day: '', year: '' }
  }
}

export function drawLogSheet(canvas, logData) {
  if (!canvas || !logData) return

  canvas.width = CANVAS_W
  canvas.height = CANVAS_H

  const ctx = canvas.getContext('2d')

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
  // Title
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Drivers Daily Log', CANVAS_W / 2, 22)

  ctx.font = '9px Arial, sans-serif'
  ctx.fillText('(24 hours)', CANVAS_W / 2, 35)

  // "Original — File at home terminal" note
  ctx.textAlign = 'right'
  ctx.font = '8px Arial, sans-serif'
  ctx.fillStyle = '#555555'
  ctx.fillText('Original — File at home terminal', CANVAS_W - 30, 22)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#000000'

  const dateParts = parseDateParts(logData.date)
  const totalMiles = Math.round(logData.total_miles || logData.totalMiles || 0)
  const carrier = logData.carrier || 'Transport Co.'
  const truckNum = logData.truck_number || logData.truckNumber || 'Unit 1'
  const fromLoc = logData.from_location || logData.fromLocation || ''
  const toLoc = logData.to_location || logData.toLocation || ''
  const shippingDoc = logData.shipping_doc || logData.shippingDoc || ''

  // Row 1: Date (month/day/year boxes) + From/To
  const y1 = 52
  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.fillText('Date:', 30, y1)

  // Date boxes
  const dateBoxX = 62
  const boxW = 32
  const boxH = 14
  const boxY = y1 - 11
  ctx.lineWidth = 0.8
  ctx.strokeStyle = '#000000'

  // Month box
  ctx.strokeRect(dateBoxX, boxY, boxW, boxH)
  ctx.font = '11px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(dateParts.month, dateBoxX + boxW / 2, y1)
  ctx.font = '7px Arial, sans-serif'
  ctx.fillStyle = '#666666'
  ctx.fillText('(month)', dateBoxX + boxW / 2, y1 + 9)

  // Separator slash
  ctx.fillStyle = '#000000'
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText('/', dateBoxX + boxW + 4, y1)

  // Day box
  const dayBoxX = dateBoxX + boxW + 10
  ctx.strokeRect(dayBoxX, boxY, boxW, boxH)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(dateParts.day, dayBoxX + boxW / 2, y1)
  ctx.font = '7px Arial, sans-serif'
  ctx.fillStyle = '#666666'
  ctx.fillText('(day)', dayBoxX + boxW / 2, y1 + 9)

  // Separator slash
  ctx.fillStyle = '#000000'
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText('/', dayBoxX + boxW + 4, y1)

  // Year box
  const yearBoxX = dayBoxX + boxW + 10
  const yearBoxW = 44
  ctx.strokeRect(yearBoxX, boxY, yearBoxW, boxH)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(dateParts.year, yearBoxX + yearBoxW / 2, y1)
  ctx.font = '7px Arial, sans-serif'
  ctx.fillStyle = '#666666'
  ctx.fillText('(year)', yearBoxX + yearBoxW / 2, y1 + 9)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#000000'

  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.fillText('From:', 280, y1)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(fromLoc.substring(0, 40), 315, y1)

  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.fillText('To:', 620, y1)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(toLoc.substring(0, 40), 640, y1)

  // Row 2: Two miles fields + Carrier + Vehicle
  const y2 = 72
  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.fillText('Total Miles Driving Today:', 30, y2)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(`${totalMiles}`, 170, y2)

  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.fillText('Total Mileage Today:', 220, y2)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(`${totalMiles}`, 340, y2)

  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.fillText('Name of Carrier or Carriers:', 400, y2)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(carrier, 560, y2)

  // Row 3: Truck/Trailer numbers + 24-hr period start + Home Terminal
  const y3 = 88
  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.fillText('Truck/Tractor and Trailer Numbers:', 30, y3)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(truckNum, 220, y3)

  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.fillText('24-Hour Period Starting Time:', 380, y3)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText('Midnight', 545, y3)

  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.fillText('Home Terminal:', 650, y3)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText('___________', 740, y3)

  // Row 4: Shipping Documents / DVL / Shipper
  const y4 = 103
  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.fillText('DVL or Manifest No.:', 30, y4)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(shippingDoc || '_______________', 148, y4)

  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.fillText('Shipper & Commodity:', 310, y4)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText('___________________________', 435, y4)

  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.fillText('Main Office:', 700, y4)
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText('___________', 770, y4)

  // Divider
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(20, 112)
  ctx.lineTo(CANVAS_W - 20, 112)
  ctx.stroke()
}

function drawGrid(ctx) {
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.5

  ctx.strokeRect(GRID_LEFT, GRID_TOP, GRID_W, GRID_H)

  ctx.lineWidth = 1
  for (let r = 1; r < 4; r++) {
    const y = GRID_TOP + r * ROW_H
    ctx.beginPath()
    ctx.moveTo(GRID_LEFT, y)
    ctx.lineTo(GRID_RIGHT, y)
    ctx.stroke()
  }

  ctx.fillStyle = '#000000'
  ctx.font = '9px Arial, sans-serif'
  ctx.textAlign = 'right'
  for (let r = 0; r < 4; r++) {
    const y = rowToY(r)
    ctx.fillText(ROW_LABELS[r], GRID_LEFT - 4, y + 3)
  }

  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.textAlign = 'center'
  for (let r = 0; r < 4; r++) {
    const y = rowToY(r)
    ctx.fillText(`${r + 1}`, GRID_LEFT + 8, y + 4)
  }

  // Black header bar behind hour labels
  const headerBarH = 22
  const headerBarY = GRID_TOP - headerBarH - 2
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(GRID_LEFT, headerBarY, GRID_W, headerBarH)

  ctx.textAlign = 'center'
  ctx.font = '9px Arial, sans-serif'
  for (let h = 0; h <= 24; h++) {
    const x = timeToX(h)

    ctx.strokeStyle = '#000000'
    ctx.lineWidth = h === 0 || h === 12 || h === 24 ? 1.5 : 0.8
    ctx.beginPath()
    ctx.moveTo(x, GRID_TOP)
    ctx.lineTo(x, GRID_BOTTOM)
    ctx.stroke()

    // Draw hour labels (white text on dark bar)
    ctx.fillStyle = '#ffffff'
    const label = HOUR_LABELS[h]
    if (label.includes('\n')) {
      const parts = label.split('\n')
      ctx.font = '7px Arial, sans-serif'
      ctx.fillText(parts[0], x, headerBarY + 9)
      ctx.fillText(parts[1], x, headerBarY + 17)
    } else {
      ctx.font = '9px Arial, sans-serif'
      ctx.fillText(label, x, headerBarY + 14)
    }

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

    if (prevX !== null && prevY !== null && prevY !== y) {
      ctx.beginPath()
      ctx.moveTo(x1, prevY)
      ctx.lineTo(x1, y)
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(x1, y, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(x1, y)
    ctx.lineTo(x2, y)
    ctx.stroke()

    prevX = x2
    prevY = y
  }
}

function drawTotals(ctx, entries) {
  const totals = [0, 0, 0, 0]

  for (const entry of entries) {
    const rowIdx = STATUS_MAP[entry.status]
    if (rowIdx === undefined) continue
    const startH = parseTimeToDecimal(entry.start_time ?? entry.start)
    const endH = parseTimeToDecimal(entry.end_time ?? entry.end)
    totals[rowIdx] += endH - startH
  }

  const totalX = GRID_RIGHT + 12

  ctx.fillStyle = '#000000'
  ctx.font = 'bold 9px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Total', totalX + 20, GRID_TOP - 4)
  ctx.fillText('Hours', totalX + 20, GRID_TOP + 6)

  ctx.font = 'bold 12px Arial, sans-serif'
  ctx.textAlign = 'center'
  for (let r = 0; r < 4; r++) {
    const y = rowToY(r)
    ctx.fillText(totals[r].toFixed(2), totalX + 20, y + 4)
  }

  const sum = totals.reduce((a, b) => a + b, 0)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(totalX, GRID_BOTTOM + 4)
  ctx.lineTo(totalX + 42, GRID_BOTTOM + 4)
  ctx.stroke()

  ctx.font = 'bold 13px Arial, sans-serif'
  ctx.fillText(sum.toFixed(1), totalX + 20, GRID_BOTTOM + 20)

  const onDutyTotal = totals[2] + totals[3]
  const circleX = totalX + 20
  const circleY = GRID_BOTTOM + 40
  ctx.font = 'bold 12px Arial, sans-serif'
  ctx.fillText(onDutyTotal.toFixed(1), circleX, circleY + 4)
  ctx.beginPath()
  ctx.arc(circleX, circleY, 16, 0, Math.PI * 2)
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.font = '8px Arial, sans-serif'
  ctx.fillText('Total', circleX, circleY + 20)
  ctx.fillText('On-Duty', circleX, circleY + 28)
}

function drawRemarks(ctx, remarks, entries) {
  const remarkTop = 345
  const remarkBottom = 510
  const remarkH = remarkBottom - remarkTop

  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.strokeRect(GRID_LEFT, remarkTop, GRID_W, remarkH)

  ctx.fillStyle = '#000000'
  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('REMARKS', GRID_LEFT + 4, remarkTop + 14)

  ctx.font = '7px Arial, sans-serif'
  ctx.fillStyle = '#666666'
  ctx.fillText('Enter name of place you reported and where released from work and when and where each change of duty occurred.', GRID_LEFT + 68, remarkTop + 12)
  ctx.fillText('Use time standard of home terminal.', GRID_LEFT + 68, remarkTop + 22)

  ctx.strokeStyle = '#e5e5e5'
  ctx.lineWidth = 0.3
  for (let h = 1; h < 24; h++) {
    const x = timeToX(h)
    ctx.beginPath()
    ctx.moveTo(x, remarkTop)
    ctx.lineTo(x, remarkBottom)
    ctx.stroke()
  }

  // Horizontal guide lines for remarks text
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 0.3
  for (let row = 1; row <= 6; row++) {
    const y = remarkTop + 20 + row * 22
    ctx.beginPath()
    ctx.moveTo(GRID_LEFT, y)
    ctx.lineTo(GRID_RIGHT, y)
    ctx.stroke()
  }

  if (!remarks || remarks.length === 0) return

  ctx.fillStyle = '#000000'
  ctx.font = '9px Arial, sans-serif'
  ctx.textAlign = 'left'

  const angle = -Math.PI / 4

  for (let i = 0; i < remarks.length; i++) {
    const remark = remarks[i]

    const rawTime = remark.time || remark.start_time || 0
    const decTime = parseTimeToDecimal(rawTime)
    const hrs = Math.floor(decTime)
    const mins = Math.round((decTime - hrs) * 60)
    const timeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`

    const location = remark.text || remark.location || `${remark.city || ''} - ${remark.activity || ''}`
    const label = `${timeStr} - ${location.substring(0, 28)}`

    const x = timeToX(decTime)
    const y = remarkTop + 34

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.font = '8px Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#000000'
    ctx.fillText(label, 0, 0)
    ctx.restore()
  }
}

function drawFooter(ctx, logData) {
  const footerY = 520

  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(20, footerY)
  ctx.lineTo(CANVAS_W - 20, footerY)
  ctx.stroke()

  ctx.fillStyle = '#000000'
  ctx.textAlign = 'left'

  // Signature line
  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.fillText('Driver Signature:', 30, footerY + 18)
  ctx.font = '10px Arial, sans-serif'
  ctx.fillText('___________________________', 133, footerY + 18)

  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.fillText('Date:', 350, footerY + 18)
  ctx.font = '10px Arial, sans-serif'
  ctx.fillText('____________', 382, footerY + 18)

  // ─── RECAP — Full FMCSA table ───
  const recap = logData.recap || {}
  const onDutyToday = (recap.on_duty_today || 0).toFixed(1)
  const cycleUsed = (recap.cycle_used || 0).toFixed(1)
  const remaining = (recap.cycle_remaining || recap.remaining || 0).toFixed(1)

  const recapX = 530
  const recapY = footerY + 6
  const labelColW = 170
  const valColW = 100
  const tableW = labelColW + valColW
  const rowH = 20
  const headerH = 32
  const tableRows = 3
  const tableH = headerH + tableRows * rowH

  // Table title
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 11px Arial, sans-serif'
  ctx.fillText('RECAP — Complete at end of day', recapX, recapY)

  const tableTop = recapY + 6

  // Outer border
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.5
  ctx.strokeRect(recapX, tableTop, tableW, tableH)

  // Header row — two cells
  ctx.lineWidth = 1
  // Vertical divider
  ctx.beginPath()
  ctx.moveTo(recapX + labelColW, tableTop)
  ctx.lineTo(recapX + labelColW, tableTop + tableH)
  ctx.stroke()

  // Header bottom line
  ctx.beginPath()
  ctx.moveTo(recapX, tableTop + headerH)
  ctx.lineTo(recapX + tableW, tableTop + headerH)
  ctx.stroke()

  // Header text — right column
  ctx.font = 'bold 10px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('70 Hour /', recapX + labelColW + valColW / 2, tableTop + 14)
  ctx.fillText('8 Day', recapX + labelColW + valColW / 2, tableTop + 26)

  // Row lines
  for (let r = 1; r < tableRows; r++) {
    const ry = tableTop + headerH + r * rowH
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(recapX, ry)
    ctx.lineTo(recapX + tableW, ry)
    ctx.stroke()
  }

  // Row 1: On-duty hours today
  ctx.textAlign = 'left'
  ctx.font = '9px Arial, sans-serif'
  ctx.fillStyle = '#000000'
  const dataY1 = tableTop + headerH + 14
  ctx.fillText('On-duty hours today', recapX + 6, dataY1)
  ctx.textAlign = 'center'
  ctx.font = 'bold 11px Arial, sans-serif'
  ctx.fillText(onDutyToday, recapX + labelColW + valColW / 2, dataY1)

  // Row 2: Total hrs last 7 days incl. today
  ctx.textAlign = 'left'
  ctx.font = '9px Arial, sans-serif'
  const dataY2 = tableTop + headerH + rowH + 8
  ctx.fillText('Total hrs last 7', recapX + 6, dataY2)
  ctx.fillText('days incl. today', recapX + 6, dataY2 + 10)
  ctx.textAlign = 'center'
  ctx.font = 'bold 11px Arial, sans-serif'
  ctx.fillText(cycleUsed, recapX + labelColW + valColW / 2, dataY2 + 5)

  // Row 3: Total hrs available tomorrow
  ctx.textAlign = 'left'
  ctx.font = '9px Arial, sans-serif'
  const dataY3 = tableTop + headerH + 2 * rowH + 8
  ctx.fillText('Total hrs available', recapX + 6, dataY3)
  ctx.fillText('tomorrow', recapX + 6, dataY3 + 10)
  ctx.textAlign = 'center'
  ctx.font = 'bold 12px Arial, sans-serif'
  const remainingNum = parseFloat(remaining)
  ctx.fillStyle = remainingNum < 11 ? '#dc2626' : '#16a34a'
  ctx.fillText(remaining, recapX + labelColW + valColW / 2, dataY3 + 5)

  // FMCSA notice
  ctx.fillStyle = '#888888'
  ctx.font = '8px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    'Generated in compliance with FMCSA Hours of Service regulations (49 CFR Part 395)',
    CANVAS_W / 2,
    CANVAS_H - 6,
  )
}
