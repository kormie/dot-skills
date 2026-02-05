#!/bin/bash
# Kill any process listening on port 3333 (kanban server)
lsof -ti:3333 | xargs kill 2>/dev/null || true
