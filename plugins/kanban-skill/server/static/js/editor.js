window.KanbanEditor = {
  init() {
    const editorModal = document.getElementById('editorModal');
    const editorTextarea = document.getElementById('editorTextarea');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const newTicketModal = document.getElementById('newTicketModal');
    const newTicketForm = document.getElementById('newTicketForm');
    const newTicketCancelBtn = document.getElementById('newTicketCancelBtn');

    let previewDebounceTimer = null;

    editorTextarea.addEventListener('input', () => {
      clearTimeout(previewDebounceTimer);
      previewDebounceTimer = setTimeout(() => this.updatePreview(), 300);
    });

    cancelBtn.addEventListener('click', () => this.closeEditor());
    saveBtn.addEventListener('click', () => this.saveTicket());

    editorModal.addEventListener('click', (e) => {
      if (e.target === editorModal) this.closeEditor();
    });

    newTicketCancelBtn.addEventListener('click', () => this.closeNewTicketModal());
    newTicketModal.addEventListener('click', (e) => {
      if (e.target === newTicketModal) this.closeNewTicketModal();
    });

    newTicketForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitNewTicket();
    });

    document.getElementById('newTicketBtn').addEventListener('click', () => this.openNewTicketModal());

    window.addEventListener('card-selected', (e) => {
      const { ticket, column } = e.detail;
      this.openEditor(ticket, column);
    });
  },

  openEditor(ticket, column) {
    const app = window.KanbanApp;
    app.currentEditTicket = ticket;
    app.currentEditColumn = column;
    app.isNewTicket = false;
    document.getElementById('modalTitle').textContent = `Edit: ${ticket.title}`;

    fetch(`/api/ticket/${column}/${ticket.filename}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById('editorTextarea').value = data.content;
        this.updatePreview();
        document.getElementById('editorModal').classList.add('active');
      })
      .catch(err => {
        console.error('Failed to load ticket:', err);
        alert('Failed to load ticket content');
      });
  },

  openEditorWithContent(content, title) {
    const app = window.KanbanApp;
    app.isNewTicket = true;
    app.currentEditTicket = null;
    app.currentEditColumn = 'todo';
    document.getElementById('modalTitle').textContent = title || 'New Ticket';
    document.getElementById('editorTextarea').value = content;
    this.updatePreview();
    document.getElementById('editorModal').classList.add('active');
  },

  closeEditor() {
    const app = window.KanbanApp;
    document.getElementById('editorModal').classList.remove('active');
    app.currentEditTicket = null;
    app.currentEditColumn = null;
    document.getElementById('editorTextarea').value = '';
    document.getElementById('previewContent').innerHTML = '';
  },

  updatePreview() {
    document.getElementById('previewContent').innerHTML =
      marked.parse(document.getElementById('editorTextarea').value);
  },

  async saveTicket() {
    const app = window.KanbanApp;
    const content = document.getElementById('editorTextarea').value;
    try {
      if (app.isNewTicket) {
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Failed to create ticket');
      } else {
        const response = await fetch(`/api/ticket/${app.currentEditColumn}/${app.currentEditTicket.filename}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Failed to save ticket');
      }
      this.closeEditor();
      await app.loadTickets();
      if (app.currentView === 'table') window.KanbanTable.renderTable();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save ticket');
    }
  },

  async loadWorkstreamsForDropdown() {
    const select = document.getElementById('ticketWorkstream');
    try {
      const response = await fetch('/api/workstreams');
      if (!response.ok) throw new Error('Failed to fetch workstreams');
      const data = await response.json();
      select.innerHTML = '<option value="">-- None --</option>';
      (data.workstreams || []).forEach(ws => {
        const option = document.createElement('option');
        option.value = ws.slug;
        option.textContent = ws.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading workstreams:', error);
    }
  },

  openNewTicketModal() {
    document.getElementById('newTicketModal').classList.add('active');
    document.getElementById('ticketTitle').value = '';
    document.getElementById('ticketType').value = 'feature';
    document.getElementById('ticketPriority').value = 'medium';
    document.getElementById('ticketWorkstream').value = '';
    this.loadWorkstreamsForDropdown();
  },

  closeNewTicketModal() {
    document.getElementById('newTicketModal').classList.remove('active');
  },

  submitNewTicket() {
    const type = document.getElementById('ticketType').value;
    const title = document.getElementById('ticketTitle').value;
    const priority = document.getElementById('ticketPriority').value;
    const workstream = document.getElementById('ticketWorkstream').value;

    const today = new Date().toISOString().split('T')[0];
    const workstreamLine = workstream ? `workstream: ${workstream}\n` : '';
    const template = `---
type: ${type}
title: "${title}"
priority: ${priority}
created: ${today}
${workstreamLine}---

# ${title}

## Description

_Describe the ticket here..._

## Acceptance Criteria

- [ ] Criteria 1
- [ ] Criteria 2

## Notes

`;
    this.closeNewTicketModal();
    this.openEditorWithContent(template, `New Ticket: ${title}`);
  }
};
