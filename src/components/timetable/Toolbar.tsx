import {
  LayoutList, LayoutGrid, Users, GraduationCap,
  Eye, EyeOff, DoorOpen, Pencil, RefreshCcw,
  FileSpreadsheet, Printer, ArrowLeft, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OrgType } from '@/types'
import { ORG_CONFIGS } from '@/lib/orgData'

interface ToolbarProps {
  orgType: OrgType
  entities: string[]
  selectedEntity: string
  onSelectEntity: (e: string) => void
  viewTab: 'class' | 'teacher'
  onViewTab: (t: 'class' | 'teacher') => void
  transposed: boolean
  onTranspose: (v: boolean) => void
  showTeacher: boolean
  onShowTeacher: () => void
  showRoom: boolean
  onShowRoom: () => void
  editMode: boolean
  onEditMode: () => void
  conflictCount: number
  onSubstitution: () => void
  onExportExcel: () => void
  onPrint: () => void
  onBack: () => void
}

export function Toolbar({
  orgType, entities, selectedEntity, onSelectEntity,
  viewTab, onViewTab, transposed, onTranspose,
  showTeacher, onShowTeacher, showRoom, onShowRoom,
  editMode, onEditMode, conflictCount,
  onSubstitution, onExportExcel, onPrint, onBack,
}: ToolbarProps) {
  const cfg = ORG_CONFIGS[orgType]

  return (
    <div className="bg-white border-b border-gray-200 flex items-center gap-2 px-3 py-1.5 flex-wrap min-h-[46px] no-print">

      {/* Orientation toggle */}
      <div className="flex border border-gray-200 rounded-md overflow-hidden">
        <button onClick={() => onTranspose(false)} className={cn('px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1 transition-colors', !transposed ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50')}>
          <LayoutList className="w-3.5 h-3.5" /> Normal
        </button>
        <button onClick={() => onTranspose(true)} className={cn('px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1 transition-colors', transposed ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50')}>
          <LayoutGrid className="w-3.5 h-3.5" /> Transposed
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200" />

      {/* Class / Teacher toggle */}
      <div className="flex border border-gray-200 rounded-md overflow-hidden">
        <button onClick={() => onViewTab('class')} className={cn('px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1 transition-colors', viewTab === 'class' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50')}>
          <Users className="w-3.5 h-3.5" /> {cfg.sectionLabel}
        </button>
        <button onClick={() => onViewTab('teacher')} className={cn('px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1 transition-colors', viewTab === 'teacher' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50')}>
          <GraduationCap className="w-3.5 h-3.5" /> {cfg.staffLabel}
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200" />

      {/* Entity selector */}
      <select
        value={selectedEntity}
        onChange={e => onSelectEntity(e.target.value)}
        className="border border-gray-200 rounded-md px-2 py-1.5 text-[11px] bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400"
      >
        {entities.map(e => <option key={e} value={e}>{e}</option>)}
      </select>

      <div className="w-px h-5 bg-gray-200" />

      {/* Visibility */}
      <button onClick={onShowTeacher} className={cn('flex items-center gap-1 px-2.5 py-1.5 border rounded-md text-[11px] font-medium transition-all', showTeacher ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
        {showTeacher ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {cfg.staffLabel}
      </button>
      <button onClick={onShowRoom} className={cn('flex items-center gap-1 px-2.5 py-1.5 border rounded-md text-[11px] font-medium transition-all', showRoom ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
        <DoorOpen className="w-3.5 h-3.5" /> Room
      </button>

      <div className="w-px h-5 bg-gray-200" />

      {/* Edit + Sub */}
      <button onClick={onEditMode} className={cn('flex items-center gap-1 px-2.5 py-1.5 border rounded-md text-[11px] font-medium transition-all', editMode ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
        <Pencil className="w-3.5 h-3.5" /> {editMode ? 'Editing' : 'Edit'}
      </button>
      <button onClick={onSubstitution} className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
        <RefreshCcw className="w-3.5 h-3.5" /> Substitution
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export + conflict */}
      <button onClick={onExportExcel} className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-50">
        <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
      </button>
      <button onClick={onPrint} className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-50">
        <Printer className="w-3.5 h-3.5" /> Print/PDF
      </button>
      <button onClick={onBack} className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-50">
        <ArrowLeft className="w-3.5 h-3.5" /> Wizard
      </button>

      {/* Conflicts */}
      <span className={cn('flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold', conflictCount === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
        {conflictCount === 0
          ? <><CheckCircle2 className="w-3 h-3" /> 0 conflicts</>
          : <><AlertCircle className="w-3 h-3" /> {conflictCount} conflict{conflictCount > 1 ? 's' : ''}</>
        }
      </span>
    </div>
  )
}
