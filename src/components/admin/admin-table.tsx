'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty } from '@/components/ui/empty';
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, ColumnDef, PaginationState, OnChangeFn } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

const variantStyles = {
  default: {
    cell: 'px-6 py-4',
    header: 'px-6 py-3',
  },
  compact: {
    cell: 'px-4 py-3',
    header: 'px-4 py-3',
  },
  selectable: {
    cell: 'px-6 py-4',
    header: 'px-6 py-3',
  },
} as const;

interface AdminTableProps<T> {
  variant: 'default' | 'compact' | 'selectable';
  columns: ColumnDef<T, unknown>[];
  data: T[];
  emptyMessage?: string;
  enableRowSelection?: boolean;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (rowSelection: Record<string, boolean>) => void;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
}

export function AdminTable<T extends { id: string }>({
  variant,
  columns,
  data,
  emptyMessage = 'No hay datos',
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
  pagination,
  onPaginationChange,
}: AdminTableProps<T>) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection,
    getRowId: (row) => row.id,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      onRowSelectionChange?.(newSelection);
    },
    state: {
      rowSelection,
      pagination,
    },
    onPaginationChange,
  });

  const styles = variantStyles[variant];

  if (data.length === 0) {
    return (
      <Empty>
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </Empty>
    );
  }

  return (
    <div className="w-full overflow-auto rounded-xl border border-border">
      <Table>
        <TableHeader className="sticky top-0 bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={styles.header}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(
                "hover:bg-muted/50 transition-colors",
                variant === "selectable" && "group"
              )}
              data-state={row.getIsSelected() ? 'selected' : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={styles.cell}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
