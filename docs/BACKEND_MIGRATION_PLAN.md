# Rencana Migrasi Backend/Database

## Skema tabel awal
- `users(id, username, display_name, role, password_hash, is_active, signature_json, created_at, updated_at)`
- `auth_sessions(id, user_id, expires_at, ip_address, user_agent)`
- `participants(id, participant_number, name, identity_json, created_at)`
- `token_batches(id, name, expires_at, status, notes, created_by)`
- `access_tokens(id, batch_id, token_hash, unique_key_hash, status, max_attempts, used_attempts, active_session_id, expires_at)`
- `participant_sessions(id, token_id, participant_id, status, answered_count, total_items, started_at, last_activity_at, completed_at)`
- `questions_versions(id, version_name, status, snapshot_json, license_json, created_by, activated_by)`
- `config_versions(id, config_type, version_name, status, snapshot_json, validation_json, license_json, changelog, created_by, reviewed_by, activated_by)`
- `results(id, participant_id, token_id, answers_json, scores_json, validity_json, config_versions_json, workflow_json, created_at)`
- `rh_forms(id, result_id, form_json, risk_flags_json, submitted_at)`
- `specialist_reviews(id, result_id, review_json, checklist_json, status, locked_at)`
- `final_signatures(id, result_id, signed_by, report_hash, signature_json, signed_at)`
- `audit_logs(id, timestamp, actor_json, action, target_type, target_id, description, metadata_json, severity)`
- `backups(id, type, checksum, storage_uri, created_by, created_at)`

## Mapping localStorage ke backend
- `sppg_mmpi2_audit_logs` → `audit_logs`
- `sppg_mmpi2_config_versions` → `config_versions`/`questions_versions`
- `sppg_mmpi2_session_monitoring` → `participant_sessions`
- `sppg_mmpi2_access_tokens` → `access_tokens`
- `sppg_mmpi2_token_batches` → `token_batches`
- `sppg_mmpi2_results` → `results`
- `sppg_mmpi2_rh_forms` → `rh_forms`
- `sppg_mmpi2_backups` dan `sppg_mmpi2_snapshots` → `backups`
- `sppg_mmpi2_lockdown_mode` → `system_settings(lockdown_mode)`

## API endpoint usulan
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET/POST/PATCH /api/users`
- `POST /api/token-batches`, `GET /api/token-batches`, `POST /api/token-batches/:id/revoke`
- `POST /api/participant/access`, `PATCH /api/sessions/:id/progress`, `GET /api/sessions/monitoring`
- `POST /api/config-versions`, `POST /api/config-versions/:id/validate`, `POST /api/config-versions/:id/activate`
- `POST /api/results`, `GET /api/results`, `GET /api/results/:id`
- `POST /api/rh-forms`, `PATCH /api/rh-forms/:id`
- `POST /api/results/:id/review`, `POST /api/results/:id/finalize`, `POST /api/results/:id/unlock`
- `GET /api/audit-logs`, `GET /api/analytics`, `GET /api/anomalies`
- `POST /api/backups`, `POST /api/backups/:id/restore`

## Auth dan role
Gunakan role `superadmin`, `tester`, `specialist`, dan role approval institusi bila diperlukan. Permission harus dievaluasi server-side, bukan hanya UI.

## Audit log server-side
Audit ditulis oleh backend memakai waktu server, actor dari session server, IP/user-agent, dan opsi append-only/WORM storage untuk lingkungan resmi.

## Storage file laporan
PDF/HTML final disimpan di object storage privat dengan checksum, metadata config version, signature metadata, dan kebijakan retensi.

## Backup dan disaster recovery
Tetapkan RPO/RTO, backup terenkripsi harian, restore drill berkala, snapshot sebelum import/reset, dan prosedur lockdown saat insiden.
