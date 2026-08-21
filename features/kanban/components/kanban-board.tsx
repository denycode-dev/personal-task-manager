"use client";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy,
  useSortable, verticalListSortingStrategy, arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash, DotsSixVertical, ArrowRight, CircleNotch } from "@phosphor-icons/react";
import type { KanbanBoard, KanbanCard, KanbanColumn } from "@/lib/db/schema";
import { reorderCardsAction } from "@/features/kanban/actions/card.action";
import { createColumnAction, deleteColumnAction, reorderColumnsAction } from "@/features/kanban/actions/column.action";
import { DeadlineBadge } from "@/features/deadlines/components/deadline-badge";
import { CardDetailDialog } from "@/features/kanban/components/card-detail-dialog";
import { CreateCardDialog } from "@/features/kanban/components/create-card-dialog";
import { useConfirm } from "@/lib/hooks/use-confirm";

type Column = KanbanColumn & { cards: KanbanCard[] };

function KanbanCardItem({ card, onOpen }: { card: KanbanCard; onOpen: (c: KanbanCard) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: "card", card },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      onClick={() => onOpen(card)}
      className="bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-black mt-0.5 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          aria-label={`Geser posisi kartu ${card.title}`}
          title="Geser posisi kartu"
        >
          <DotsSixVertical size={14} weight="bold" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-snug group-hover:underline decoration-1">{card.title}</p>
          {card.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
          )}
          {card.deadline && (
            <div className="mt-1.5 flex items-center gap-1">
              <DeadlineBadge deadline={card.deadline} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumnView({
  column,
  boardId,
  isFirst,
  onCardOpen,
  onAddCardToColumn,
}: {
  column: Column;
  boardId: string;
  isFirst: boolean;
  onCardOpen: (c: KanbanCard) => void;
  onAddCardToColumn: (columnId: string) => void;
}) {
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `col-${column.id}`,
    data: { type: "column", column },
  });

  const handleDeleteColumn = async () => {
    const ok = await confirm({
      title: "Hapus kolom",
      message: `Hapus kolom "${column.name}"? Semua kartu di dalamnya juga akan dihapus.`,
      confirmLabel: "Hapus kolom",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteColumnAction(boardId, column.id);
      toast.success("Kolom dihapus.");
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="flex-shrink-0 w-72 bg-gray-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[calc(100vh-10rem)] transition-shadow"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-white">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-black flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-0.5 -m-0.5 rounded hover:bg-gray-100"
            aria-label={`Geser posisi kolom ${column.name}`}
            title="Geser posisi kolom"
          >
            <DotsSixVertical size={16} weight="bold" />
          </button>
          <span className="font-bold text-sm truncate">{column.name}</span>
          <span className="text-xs bg-gray-100 border border-black px-1.5 flex-shrink-0">{column.cards.length}</span>
          {isFirst && (
            <span className="text-[10px] bg-yellow-400 border border-black px-1 font-bold uppercase flex-shrink-0">MASUK</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => onAddCardToColumn(column.id)}
            className="p-1 text-black hover:bg-yellow-300 border border-transparent hover:border-black rounded transition-colors cursor-pointer inline-flex items-center justify-center"
            title={`Tambah kartu ke kolom ${column.name}`}
          >
            <Plus size={14} weight="bold" />
          </button>
          <button
            suppressHydrationWarning
            onClick={handleDeleteColumn}
            disabled={isPending}
            className="p-1 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center flex-shrink-0"
            title="Hapus kolom"
          >
            {isPending ? (
              <CircleNotch size={14} weight="bold" className="animate-spin text-red-600" />
            ) : (
              <Trash size={14} weight="bold" />
            )}
          </button>
        </div>
      </div>
      <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
          {column.cards.map((card) => (
            <KanbanCardItem key={card.id} card={card} onOpen={onCardOpen} />
          ))}
          {column.cards.length === 0 && (
            <button
              type="button"
              onClick={() => onAddCardToColumn(column.id)}
              className="w-full border-2 border-dashed border-black/20 p-4 text-center text-xs text-muted-foreground h-24 flex flex-col items-center justify-center hover:bg-yellow-50 hover:border-black/50 transition-colors cursor-pointer gap-1"
            >
              <Plus size={16} weight="bold" />
              <span>Tambah kartu baru di sini</span>
            </button>
          )}
        </div>
      </SortableContext>
      <div className="p-1.5 border-t border-black/10 flex items-center justify-between text-[11px] bg-white">
        <button
          type="button"
          onClick={() => onAddCardToColumn(column.id)}
          className="w-full flex items-center justify-center gap-1 py-1 text-xs font-bold text-neutral-800 hover:bg-yellow-300 border border-transparent hover:border-black transition-all cursor-pointer"
        >
          <Plus size={12} weight="bold" />
          <span>Tambah Kartu</span>
        </button>
      </div>
    </div>
  );
}

function findColumn(id: string | null | undefined, cols: Column[]): Column | undefined {
  if (!id) return undefined;
  const colMatch = cols.find((c) => c.id === id || `col-${c.id}` === id);
  if (colMatch) return colMatch;
  return cols.find((c) => c.cards.some((k) => k.id === id));
}

export function KanbanBoard({ board, initialColumns }: { board: KanbanBoard; initialColumns: Column[] }) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [createCardDefaultColumnId, setCreateCardDefaultColumnId] = useState<string | undefined>(undefined);
  const [addingCol, setAddingCol] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [isPending, startTransition] = useTransition();


  const handleCardUpdated = (updated: KanbanCard) =>
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === updated.id ? updated : c)),
      }))
    );

  const handleCardDeleted = (id: string) =>
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== id),
      }))
    );

  const handleOpenCreateCard = (columnId?: string) => {
    setCreateCardDefaultColumnId(columnId || columns[0]?.id);
    setIsCreateCardOpen(true);
  };

  const handleCardCreated = (newCard: KanbanCard, targetColumnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === targetColumnId
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      )
    );
  };

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    startTransition(async () => {
      const result = await createColumnAction(board.id, newColName.trim());
      if (result.success) {
        setColumns((prev) => [...prev, { ...result.data, cards: [] }]);
        setNewColName("");
        setAddingCol(false);
        toast.success("Kolom dibuat.");
      }
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    if (active.data.current?.type === "card") {
      setActiveCard(active.data.current.card);
      setActiveColumn(null);
    } else if (active.data.current?.type === "column") {
      setActiveColumn(active.data.current.column);
      setActiveCard(null);
    }
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    if (active.data.current?.type === "column") return;

    const activeCol = findColumn(activeId, columns);
    const overCol = findColumn(overId, columns);

    if (!activeCol || !overCol || activeCol.id === overCol.id) return;

    setColumns((prev) => {
      const sourceCol = prev.find((c) => c.id === activeCol.id);
      const destCol = prev.find((c) => c.id === overCol.id);
      if (!sourceCol || !destCol) return prev;

      const activeCardIdx = sourceCol.cards.findIndex((c) => c.id === activeId);
      if (activeCardIdx === -1) return prev;

      const cardToMove = sourceCol.cards[activeCardIdx];
      const isOverColumn = overId === destCol.id || overId === `col-${destCol.id}`;

      let newIndex: number;
      if (isOverColumn) {
        newIndex = destCol.cards.length;
      } else {
        const overCardIdx = destCol.cards.findIndex((c) => c.id === overId);
        newIndex = overCardIdx >= 0 ? overCardIdx : destCol.cards.length;
      }

      return prev.map((col) => {
        if (col.id === sourceCol.id) {
          return {
            ...col,
            cards: col.cards.filter((c) => c.id !== activeId),
          };
        }
        if (col.id === destCol.id) {
          const nextCards = [...col.cards];
          nextCards.splice(newIndex, 0, { ...cardToMove, columnId: destCol.id });
          return {
            ...col,
            cards: nextCards,
          };
        }
        return col;
      });
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const isColumn = active.data.current?.type === "column";
    setActiveCard(null);
    setActiveColumn(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (isColumn) {
      if (activeId !== overId) {
        const activeColId = activeId.startsWith("col-") ? activeId.replace("col-", "") : activeId;
        const overColId = overId.startsWith("col-") ? overId.replace("col-", "") : overId;

        const oldIndex = columns.findIndex((c) => c.id === activeColId);
        const newIndex = columns.findIndex((c) => c.id === overColId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const nextColumns = arrayMove(columns, oldIndex, newIndex);
          setColumns(nextColumns);

          const items = nextColumns.map((col, pos) => ({
            id: col.id,
            position: pos,
          }));

          startTransition(async () => {
            const result = await reorderColumnsAction(board.id, items);
            if (result && !result.success) {
              toast.error(result.error || "Gagal memperbarui urutan kolom.");
            }
          });
        }
      }
      return;
    }

    const activeCol = findColumn(activeId, columns);
    const overCol = findColumn(overId, columns);

    if (!activeCol || !overCol) return;

    const activeColIdx = columns.findIndex((c) => c.id === activeCol.id);
    const overColIdx = columns.findIndex((c) => c.id === overCol.id);
    if (activeColIdx === -1 || overColIdx === -1) return;

    let nextColumns = [...columns];

    if (activeCol.id === overCol.id) {
      const col = columns[activeColIdx];
      const oldIndex = col.cards.findIndex((c) => c.id === activeId);
      const newIndex = col.cards.findIndex((c) => c.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        nextColumns = nextColumns.map((c, i) =>
          i === activeColIdx ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) } : c
        );
      }
    } else {
      const sourceCol = columns[activeColIdx];
      const destCol = columns[overColIdx];
      const oldIndex = sourceCol.cards.findIndex((c) => c.id === activeId);

      if (oldIndex !== -1) {
        const cardToMove = sourceCol.cards[oldIndex];
        const isOverColumn = overId === destCol.id || overId === `col-${destCol.id}`;
        const overIndex = isOverColumn ? destCol.cards.length : destCol.cards.findIndex((c) => c.id === overId);
        const newIndex = overIndex >= 0 ? overIndex : destCol.cards.length;

        const newSourceCards = sourceCol.cards.filter((c) => c.id !== activeId);
        const newDestCards = [...destCol.cards];
        newDestCards.splice(newIndex, 0, { ...cardToMove, columnId: destCol.id });

        nextColumns = nextColumns.map((c) => {
          if (c.id === sourceCol.id) return { ...c, cards: newSourceCards };
          if (c.id === destCol.id) return { ...c, cards: newDestCards };
          return c;
        });
      }
    }

    setColumns(nextColumns);

    const items: { id: string; position: number; columnId: string }[] = [];
    nextColumns.forEach((col) => {
      col.cards.forEach((c, pos) => {
        items.push({ id: c.id, position: pos, columnId: col.id });
      });
    });

    startTransition(async () => {
      const result = await reorderCardsAction(items);
      if (result && !result.success) {
        toast.error(result.error || "Gagal memperbarui urutan kartu.");
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Board toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-black/15 bg-white flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => handleOpenCreateCard()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 border-2 border-black text-xs sm:text-sm font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Kartu Baru</span>
          </button>
          <span className="flex items-center gap-1 text-xs text-muted-foreground hidden sm:flex">
            <ArrowRight size={12} /> Klik kartu untuk melihat detail, deskripsi, deadline & lampiran
          </span>
        </div>
      </div>

      {/* Columns */}
      <DndContext
        id="kanban-board-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 p-4 overflow-x-auto flex-1">
          <SortableContext items={columns.map((c) => `col-${c.id}`)} strategy={horizontalListSortingStrategy}>
            {columns.map((col, idx) => (
              <KanbanColumnView
                key={col.id}
                column={col}
                boardId={board.id}
                isFirst={idx === 0}
                onCardOpen={setSelectedCard}
                onAddCardToColumn={handleOpenCreateCard}
              />
            ))}
          </SortableContext>
          <div className="flex-shrink-0 w-60">
            {addingCol ? (
              <div className="bg-gray-50 border-2 border-black p-3 space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <input
                  suppressHydrationWarning
                  autoFocus
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isPending) handleAddColumn();
                    if (e.key === "Escape") setAddingCol(false);
                  }}
                  disabled={isPending}
                  placeholder="Nama kolom..."
                  className="w-full border-2 border-black px-2 py-1 text-sm focus:outline-none disabled:opacity-60"
                />
                <div className="flex gap-1">
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={handleAddColumn}
                    disabled={isPending || !newColName.trim()}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-bold cursor-pointer disabled:opacity-50 min-w-[65px] justify-center"
                  >
                    {isPending ? (
                      <CircleNotch size={12} weight="bold" className="animate-spin" />
                    ) : (
                      <span>Tambah</span>
                    )}
                  </button>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setAddingCol(false)}
                    disabled={isPending}
                    className="px-3 py-1 text-xs border-2 border-black cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setAddingCol(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-black p-4 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Plus size={16} weight="bold" /> Tambah Kolom
              </button>
            )}
          </div>
        </div>
        <DragOverlay>
          {activeColumn && (
            <div className="flex-shrink-0 w-72 bg-gray-50 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[calc(100vh-10rem)] opacity-95 rotate-1 pointer-events-none">
              <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-white">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-muted-foreground">
                    <DotsSixVertical size={16} weight="bold" />
                  </span>
                  <span className="font-bold text-sm truncate">{activeColumn.name}</span>
                  <span className="text-xs bg-gray-100 border border-black px-1.5 flex-shrink-0">{activeColumn.cards.length}</span>
                </div>
              </div>
              <div className="p-2 space-y-2 max-h-48 overflow-hidden">
                {activeColumn.cards.slice(0, 3).map((card) => (
                  <div key={card.id} className="bg-white border-2 border-black p-2.5 text-xs font-medium truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {card.title}
                  </div>
                ))}
                {activeColumn.cards.length > 3 && (
                  <p className="text-[10px] text-center text-muted-foreground font-semibold">+{activeColumn.cards.length - 3} kartu lainnya</p>
                )}
              </div>
            </div>
          )}
          {activeCard && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 rotate-2 w-72 opacity-95 pointer-events-none">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-muted-foreground flex-shrink-0">
                  <DotsSixVertical size={16} weight="bold" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{activeCard.title}</p>
                  {activeCard.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{activeCard.description}</p>
                  )}
                  {activeCard.deadline && (
                    <div className="mt-1">
                      <DeadlineBadge deadline={activeCard.deadline} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Create Card Full Dialog */}
      <CreateCardDialog
        open={isCreateCardOpen}
        onClose={() => setIsCreateCardOpen(false)}
        columns={columns}
        defaultColumnId={createCardDefaultColumnId}
        onCardCreated={handleCardCreated}
      />

      {/* Card Detail Dialog */}
      {selectedCard && (
        <CardDetailDialog
          card={selectedCard}
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdated={handleCardUpdated}
          onDeleted={handleCardDeleted}
        />
      )}
    </div>
  );
}
