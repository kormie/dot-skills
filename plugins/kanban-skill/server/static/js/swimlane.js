window.KanbanSwimlane = {
  collapsedLanes: new Set(),

  renderSwimlanes() {
    const app = window.KanbanApp;
    const container = document.getElementById('swimlaneView');

    if (app.workstreams.length === 0) {
      container.innerHTML = '<div class="swimlane-empty-state">No workstreams defined</div>';
      return;
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...app.workstreams].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });

    container.innerHTML = '';
    sorted.forEach(ws => container.appendChild(this.createSwimlane(ws)));
  },

  createSwimlane(ws) {
    const app = window.KanbanApp;
    const { escapeHtml } = window.KanbanUtils;

    const swimlane = document.createElement('div');
    swimlane.className = 'swimlane';
    if (this.collapsedLanes.has(ws.slug)) swimlane.classList.add('collapsed');
    swimlane.dataset.slug = ws.slug;

    const progressPercent = ws.progress.total > 0 ? (ws.progress.completed / ws.progress.total) * 100 : 0;
    const progressClass = ws.status === 'completed' ? 'completed' : '';

    const header = document.createElement('div');
    header.className = 'swimlane-header';
    header.innerHTML = `
      <span class="swimlane-collapse-toggle">&#9660;</span>
      <span class="swimlane-name">${escapeHtml(ws.name)}</span>
      <span class="swimlane-priority-badge priority-${ws.priority || 'medium'}">${ws.priority || 'medium'}</span>
      <div class="swimlane-progress">
        <div class="swimlane-progress-bar">
          <div class="swimlane-progress-fill ${progressClass}" style="width: ${progressPercent}%"></div>
        </div>
        <span class="swimlane-progress-text">${ws.progress.completed}/${ws.progress.total}</span>
      </div>
    `;
    header.addEventListener('click', () => this.toggleLaneCollapse(ws.slug, swimlane));

    const body = document.createElement('div');
    body.className = 'swimlane-body';

    const columns = [
      { id: 'todo', label: 'Todo' },
      { id: 'in-progress', label: 'In Progress' },
      { id: 'ready-to-review', label: 'Ready to Review' },
      { id: 'done', label: 'Done' }
    ];

    columns.forEach(col => {
      const column = document.createElement('div');
      column.className = 'swimlane-column';

      const columnHeader = document.createElement('div');
      columnHeader.className = 'swimlane-column-header';
      columnHeader.textContent = col.label;
      column.appendChild(columnHeader);

      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'swimlane-cards';

      const columnTickets = this.getWorkstreamTickets(ws, col.id);

      if (columnTickets.length === 0) {
        cardsContainer.innerHTML = '<span class="swimlane-column-empty">-</span>';
      } else if (col.id === 'done' && !app.showDone) {
        cardsContainer.innerHTML = `<span class="swimlane-column-empty">${columnTickets.length} completed</span>`;
      } else {
        columnTickets.forEach(ticket => {
          cardsContainer.appendChild(this.createSwimlaneCard(ticket, col.id));
        });
      }

      column.appendChild(cardsContainer);
      body.appendChild(column);
    });

    swimlane.appendChild(header);
    swimlane.appendChild(body);
    return swimlane;
  },

  getWorkstreamTickets(ws, columnId) {
    const app = window.KanbanApp;
    const columnTickets = app.tickets[columnId] || [];
    return columnTickets.filter(ticket => ws.tickets && ws.tickets.includes(ticket.filename));
  },

  createSwimlaneCard(ticket, column) {
    const { escapeHtml } = window.KanbanUtils;
    const card = document.createElement('div');
    card.className = 'swimlane-card';
    card.dataset.filename = ticket.filename;
    card.dataset.column = column;

    const typeClass = `type-${ticket.type}`;
    const isBlocked = ticket.blockedBy && ticket.blockedBy.length > 0;
    let blockedBadgeHtml = isBlocked ? '<span class="blocked-badge">Blocked</span>' : '';

    card.innerHTML = `
      <span class="type-badge ${typeClass}">${ticket.type}</span>
      <span class="swimlane-card-title">${escapeHtml(ticket.title)}</span>
      ${blockedBadgeHtml}
    `;
    card.addEventListener('click', () => window.KanbanEditor.openEditor(ticket, column));
    return card;
  },

  toggleLaneCollapse(slug, swimlaneEl) {
    if (this.collapsedLanes.has(slug)) {
      this.collapsedLanes.delete(slug);
      swimlaneEl.classList.remove('collapsed');
    } else {
      this.collapsedLanes.add(slug);
      swimlaneEl.classList.add('collapsed');
    }
  }
};
