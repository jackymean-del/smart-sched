import { cn } from '@/lib/utils'
import { getSubjectColor } from '@/lib/orgData'
import type { TimetableCell as CellType } from '@/types'

interface TimetableCellProps {
  cell: CellType | undefined
  periodId: string
  day: string
  sectionName: string
  showTeacher: boolean
  showRoom: boolean
  editMode: boolean
  isSubstituted?: boolean
  substituteTeacher?: string
  onClick?: () => void
}

export function TimetableCell({
  cell, showTeacher, showRoom, editMode,
  isSubstituted, substituteTeacher, onClick,
}: TimetableCellProps) {
  if (!cell?.subject) {
    return (
      <div className="bg-gray-50 text-gray-400 rounded text-[9.5px] px-1.5 py-1 min-h-[28px] flex items-center justify-center italic">
        —
      </div>
    )
  }

  const colorClass = getSubjectColor(cell.subject)
  const displayTeacher = isSubstituted ? (substituteTeacher ?? cell.teacher) : cell.teacher

  return (
    <div
      className={cn(
        'rounded px-1.5 py-1 min-h-[28px] flex flex-col justify-center transition-all relative',
        colorClass,
        editMode && 'cursor-pointer hover:brightness-90 hover:shadow-md',
        isSubstituted && 'outline-2 outline-dashed outline-amber-400 outline-offset-1',
      )}
      onClick={editMode ? onClick : undefined}
    >
      {isSubstituted && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
      )}
      <span className="text-[9.5px] font-bold leading-tight">{cell.subject}</span>
      {showTeacher && displayTeacher && (
        <span className="text-[8px] opacity-70 font-mono mt-0.5 leading-tight">
          {isSubstituted && '🔄 '}{displayTeacher}
        </span>
      )}
      {showRoom && cell.room && (
        <span className="text-[7.5px] opacity-55 mt-0.5">{cell.room}</span>
      )}
      {cell.isClassTeacher && (
        <span className="text-[7px] bg-black/10 px-1 py-0.5 rounded mt-1 inline-block">★ CT</span>
      )}
    </div>
  )
}
