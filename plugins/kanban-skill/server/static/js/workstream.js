window.KanbanWorkstream = {
  async loadWorkstreams() {
    const app = window.KanbanApp;
    const container = document.getElementById('workstreamContainer');

    try {
      const response = await fetch('/api/workstreams');
      if (!response.ok) throw new Error('Failed to fetch workstreams');
      const data = await response.json();
      app.workstreams = data.workstreams || [];
      this.renderWorkstreamRibbon();
      this.updateOverflowIndicators();
    } catch (error) {
      console.error('Error loading workstreams:', error);
      container.innerHTML = '<span class="workstream-empty">Failed to load workstreams</span>';
    }
  },

  renderWorkstreamRibbon() {
    const app = window.KanbanApp;
    const { escapeHtml } = window.KanbanUtils;
    const container = document.getElementById('workstreamContainer');

    if (app.workstreams.length === 0) {
      container.innerHTML = '<span class="workstream-empty">No workstreams defined</span>';
      return;
    }

    container.innerHTML = '';

    app.workstreams.forEach(ws => {
      const chip = document.createElement('div');
      chip.className = 'workstream-chip';
      if (app.activeWorkstreamFilter === ws.slug) chip.classList.add('active');
      chip.dataset.slug = ws.slug;

      let statusIcon = '';
      if (ws.status === 'completed') {
        statusIcon = '<span class="workstream-chip-status-icon completed">&#10003;</span>';
      } else if (ws.status === 'blocked') {
        statusIcon = '<span class="workstream-chip-status-icon blocked">&#9888;</span>';
      }

      const progressPercent = ws.progress.total > 0 ? (ws.progress.completed / ws.progress.total) * 100 : 0;
      const progressClass = ws.status === 'completed' ? 'completed' : '';

      chip.innerHTML = `
        <span class="workstream-chip-name">${statusIcon}${escapeHtml(ws.name)}</span>
        <div class="workstream-progress-bar">
          <div class="workstream-progress-fill ${progressClass}" style="width: ${progressPercent}%"></div>
        </div>
        <span class="workstream-chip-fraction">${ws.progress.completed}/${ws.progress.total}</span>
      `;

      chip.addEventListener('click', () => this.toggleWorkstreamFilter(ws.slug));
      container.appendChild(chip);
    });
  },

  toggleWorkstreamFilter(slug) {
    const app = window.KanbanApp;
    app.activeWorkstreamFilter = (app.activeWorkstreamFilter === slug) ? null : slug;
    this.renderWorkstreamRibbon();
    window.KanbanBoard.filterBoardByWorkstream();
  },

  updateOverflowIndicators() {
    const ribbon = document.getElementById('workstreamRibbon');
    const container = document.getElementById('workstreamContainer');
    const hasOverflowLeft = container.scrollLeft > 0;
    const hasOverflowRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);
    ribbon.classList.toggle('has-overflow-left', hasOverflowLeft);
    ribbon.classList.toggle('has-overflow-right', hasOverflowRight);
  },

  initListeners() {
    document.getElementById('workstreamContainer').addEventListener('scroll', () => this.updateOverflowIndicators());
    window.addEventListener('resize', () => this.updateOverflowIndicators());
  }
};
