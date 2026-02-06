window.KanbanBoard = {
  renderCard(ticket, column) {
    const app = window.KanbanApp;
    const { escapeHtml } = window.KanbanUtils;
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.filename = ticket.filename;
    card.dataset.column = column;

    const typeClass = `type-${ticket.type}`;
    const priorityClass = `priority-${ticket.priority}`;

    const isBlocked = ticket.blockedBy && ticket.blockedBy.length > 0;
    let blockedBadgeHtml = '';
    if (isBlocked) {
      const blockersList = ticket.blockedBy.map(b => escapeHtml(b)).join('\n');
      const tooltipText = `Blocked by:\n${blockersList}`;
      blockedBadgeHtml = `
        <span class="blocked-badge">Blocked
          <span class="blocked-tooltip">${tooltipText}</span>
        </span>
      `;
    }

    let workstreamBadgeHtml = '';
    if (ticket.workstream) {
      workstreamBadgeHtml = `
        <div class="card-workstream" data-workstream="${escapeHtml(ticket.workstream)}">
          <span class="card-workstream-icon">&#128279;</span>
          <span class="card-workstream-name">${escapeHtml(ticket.workstream)}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-top">
        <span class="type-badge ${typeClass}">${ticket.type}</span>
        <span class="priority-indicator ${priorityClass}" title="${ticket.priority} priority"></span>
        ${blockedBadgeHtml}
      </div>
      <div class="card-title">${escapeHtml(ticket.title)}</div>
      ${workstreamBadgeHtml}
      ${ticket.created ? `<div class="card-meta">${ticket.created}</div>` : ''}
    `;

    const workstreamBadge = card.querySelector('.card-workstream');
    if (workstreamBadge) {
      workstreamBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        window.KanbanWorkstream.toggleWorkstreamFilter(ticket.workstream);
      });
    }

    card.addEventListener('click', () => this.selectCard(card, ticket, column));
    return card;
  },

  selectCard(cardEl, ticket, column) {
    const app = window.KanbanApp;
    if (app.selectedCard) {
      app.selectedCard.classList.remove('selected');
    }
    cardEl.classList.add('selected');
    app.selectedCard = cardEl;
    window.dispatchEvent(new CustomEvent('card-selected', {
      detail: { ticket, column }
    }));
  },

  renderColumn(columnId, columnTickets) {
    const container = document.getElementById(`cards-${columnId}`);
    const countEl = document.getElementById(`count-${columnId}`);
    container.innerHTML = '';
    countEl.textContent = columnTickets.length;
    if (columnTickets.length === 0) {
      container.innerHTML = '<div class="empty-state">No tickets</div>';
      return;
    }
    columnTickets.forEach(ticket => {
      container.appendChild(this.renderCard(ticket, columnId));
    });
  },

  filterBoardByWorkstream() {
    const app = window.KanbanApp;
    const allCards = document.querySelectorAll('.card');
    if (!app.activeWorkstreamFilter) {
      allCards.forEach(card => { card.style.display = ''; });
      this.updateColumnCounts();
      return;
    }
    const ws = app.workstreams.find(w => w.slug === app.activeWorkstreamFilter);
    if (!ws) return;
    allCards.forEach(card => {
      const filename = card.dataset.filename;
      card.style.display = ws.tickets.includes(filename) ? '' : 'none';
    });
    this.updateColumnCounts();
  },

  updateColumnCounts() {
    ['todo', 'in-progress', 'ready-to-review'].forEach(columnId => {
      const container = document.getElementById(`cards-${columnId}`);
      const countEl = document.getElementById(`count-${columnId}`);
      const visibleCards = container.querySelectorAll('.card:not([style*="display: none"])');
      countEl.textContent = visibleCards.length;
    });
  }
};
