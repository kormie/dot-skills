window.KanbanTable = {
  renderTable() {
    const app = window.KanbanApp;
    const { escapeHtml } = window.KanbanUtils;
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    const statusLabels = {
      'todo': 'Todo',
      'in-progress': 'In Progress',
      'ready-to-review': 'Ready to Review',
      'done': 'Done'
    };

    const columnsToShow = app.showDone
      ? ['todo', 'in-progress', 'ready-to-review', 'done']
      : ['todo', 'in-progress', 'ready-to-review'];

    columnsToShow.forEach(column => {
      (app.tickets[column] || []).forEach(ticket => {
        const tr = document.createElement('tr');
        const isBlocked = ticket.blockedBy && ticket.blockedBy.length > 0;
        const blockedDisplay = isBlocked ? '<span class="blocked-badge">Blocked</span>' : '-';
        const workstreamDisplay = ticket.workstream ? escapeHtml(ticket.workstream) : '-';
        tr.innerHTML = `
          <td>${statusLabels[column]}</td>
          <td>${blockedDisplay}</td>
          <td><span class="type-badge type-${ticket.type}">${ticket.type}</span></td>
          <td><span class="priority-indicator priority-${ticket.priority}" style="display:inline-block;"></span> ${ticket.priority}</td>
          <td>${escapeHtml(ticket.title)}</td>
          <td>${workstreamDisplay}</td>
          <td>${ticket.created || '-'}</td>
        `;
        tr.addEventListener('click', () => window.KanbanEditor.openEditor(ticket, column));
        tbody.appendChild(tr);
      });
    });

    if (tbody.children.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">No tickets</td></tr>';
    }
  }
};
