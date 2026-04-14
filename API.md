# API Documentation — HOMECI Services & Hooks

> Document de référence pour les développeurs. Décrit l'API publique de chaque service et hook.
> Dernière mise à jour : 2026-04-13

---

## Services

### auditService
```typescript
// Enregistre une action dans les logs d'audit
auditService.log(data: AuditLog): Promise<string>

// Raccourcis
auditService.logAdminLogin(uid, email, name): Promise<string>
auditService.logAdminLoginFailed(email, reason?): Promise<string>
auditService.logUserSuspend(performedBy, performedByEmail, targetUid, targetEmail, reason): Promise<string>
auditService.logUserReactivate(performedBy, performedByEmail, targetUid, targetEmail): Promise<string>
auditService.logPropertyApproved(performedBy, propertyId, propertyTitle): Promise<string>
auditService.logPropertyRejected(performedBy, propertyId, propertyTitle, reason): Promise<string>
auditService.logPropertyDeleted(performedBy, propertyId, propertyTitle, reason?): Promise<string>
auditService.logPropertyCertified(performedBy, propertyId, propertyTitle): Promise<string>
auditService.logPropertyDecertified(performedBy, propertyId, propertyTitle, reason): Promise<string>
auditService.logReportReviewed(performedBy, reportId, action, reason?): Promise<string>
auditService.logCgvUpdated(performedBy, version, role): Promise<string>

// Lecture
auditService.getAuditLogs(page, pageSize): Promise<AuditLog[]>
auditService.getLogsByAction(action, pageSize): Promise<AuditLog[]>
auditService.getLogsByUser(performedBy, pageSize): Promise<AuditLog[]>
auditService.getLogsByTarget(targetUid, pageSize): Promise<AuditLog[]>
```

### chatService
```typescript
chatService.getOrCreateChat(participants, propertyId?): Promise<string>
chatService.getChatContext(chatId): Promise<ChatContext>
chatService.sendMessage(chatId, content, senderId, options?): Promise<void>
chatService.subscribeToMessages(chatId, pageSize, callback): Unsubscribe
chatService.getMessagesBefore(chatId, beforeTimestamp, pageSize): Promise<Message[]>
chatService.searchMessages(chatId, searchTerm, maxResults): Promise<Message[]>
chatService.getLastMessage(chatId): Promise<Message | null>
chatService.markMessageAsRead(messageId): Promise<void>
chatService.uploadChatAttachment(chatId, file, options): Promise<string>
```

### dossierService
```typescript
dossierService.upload(userId, file, type): Promise<string>
dossierService.delete(userId, fileId): Promise<void>
dossierService.validate(userId, fileId): Promise<void>
dossierService.submit(userId): Promise<void>
dossierService.findTenantsWithCompleteDossier(): Promise<User[]>
```

### exportService
```typescript
exportService.exportUsers(users: ExportableUser[]): void
exportService.exportProperties(properties: ExportableProperty[]): void
exportService.exportVisits(visits: ExportableVisit[]): void
exportService.exportSurveys(surveys: ExportableSurvey[]): void
exportService.exportReports(reports: ExportableReport[]): void
exportService.getColumns(type: ExportType): { key: string; label: string }[]
```

### fileScanner
```typescript
fileScanner.scan(file: File | Blob, options: ScanOptions): Promise<ScanResult>
fileScanner.quickCheck(file: File): { safe: boolean; reason?: string }

// Serveur (Cloud Functions)
scanServerFile(filePath, bucket, options): Promise<ScanResult>
```

### ipWhitelist
```typescript
checkAdminIp(clientIp: string): boolean
isIpRestrictionEnabled(): boolean
getAllowedIps(): string[]
adminIpMiddleware(req, res, next): void
adminIpMiddlewareVercel(req: Request): Response | null
```

### movapayService
```typescript
movapayService.initiateTransaction(amount, currency, phone, provider, reference): Promise<TransactionResult>
movapayService.verifyTransaction(reference): Promise<TransactionStatus>
```

### notificationService
```typescript
notificationService.create(userId, type, title, message, options?): Promise<string>
notificationService.getAll(userId, limit): Promise<Notification[]>
notificationService.markAsRead(notificationId): Promise<void>
notificationService.markAllAsRead(userId): Promise<void>
```

### propertyService
```typescript
propertyService.create(data): Promise<string>
propertyService.getById(id): Promise<Property | null>
propertyService.getAll(options?): Promise<Property[]>
propertyService.update(id, data): Promise<void>
propertyService.delete(id): Promise<void>
propertyService.search(query, options?): Promise<Property[]>
```

### visitService
```typescript
visitService.create(data): Promise<string>
visitService.getById(id): Promise<Visit | null>
visitService.getAll(options?): Promise<Visit[]>
visitService.getByOwner(ownerId, options?): Promise<Visit[]>
visitService.getByTenant(tenantId, options?): Promise<Visit[]>
visitService.update(id, data): Promise<void>
visitService.respond(id, action, options?): Promise<void>
```

### comparisonService (PropertyComparison)
```typescript
comparisonService.getComparisons(): string[]
comparisonService.addProperty(propertyId: string): string[]
comparisonService.removeProperty(propertyId: string): string[]
comparisonService.clear(): void
comparisonService.isComparing(propertyId: string): boolean
comparisonService.count(): number

// React Hook
useComparison(): { propertyIds, add, remove, clear, count }
```

---

## Hooks

### useAdminDashboard
```typescript
useAdminDashboard(profile): {
  users, properties, stats, loading, toast,
  filterRole, setFilterRole,
  filterDate, setFilterDate,
  filterPropType, setFilterPropType,
  filterPropStatus, setFilterPropStatus,
  filterPropCity, setFilterPropCity,
  sortProp, setSortProp,
  filterModType, setFilterModType,
  sortMod, setSortMod,
  filteredUsers, filteredProperties, pendingProperties, filteredPendingProperties,
  rejectProperty, handleConsumeToken, showToast
}
```

### useChat
```typescript
useChat(chatId?): {
  messages, loading, error, hasMore, loadingMore,
  sendMessage, sendMessageWithAttachment,
  loadMoreMessages, searchMessages, clearSearch,
  searchResults, searchTerm, messagesContainerRef,
  isSending, uploadProgress
}
```

### useNotaireDashboard
```typescript
useNotaireDashboard(profile): {
  loading, properties, owners, stats,
  actionLoading, takingId, certifyingId,
  revokeModal, setRevokeModal,
  delegationToken, setDelegationToken,
  handleDocAction, handleCertify, doTakeCharge, handleRevoke, handleDelegateAction
}
```

### useOwnerProperties
```typescript
useOwnerProperties(): {
  properties, loading, stats, totalVisits,
  viewsChartData, typeChartData, monthlyChartData,
  exportCSV, showToast
}
```

### useOwnerVisits
```typescript
useOwnerVisits(): {
  visits, loading, responseModal, setResponseModal,
  acceptVisit, rejectVisit, counterPropose,
  onShowToast
}
```

### useTenantDossier
```typescript
useTenantDossier(): {
  documents, uploading, submitting, submittedAt,
  uploadDocument, deleteDocument, submitDossier
}
```

### useTenantProperties
```typescript
useTenantProperties(filters?): {
  properties, loading, hasMore, loadMore,
  searchResults, searchTerm,
  sort, setSort
}
```

### usePresence
```typescript
usePresence(userId): void
// Met à jour last_seen toutes les 15s + sur activité utilisateur
```

### useFavorites
```typescript
useFavorites(userId): {
  favorites, loading,
  addFavorite, removeFavorite, isFavorite
}
```

---

## Cloud Functions

| Fonction | Trigger | Description |
|---|---|---|
| `autoResetPropertyStatus` | Scheduler (1h) | Reset visites sans réponse après 3j |
| `sendPushNotification` | Firestore onCreate `/notifications/{id}` | Push FCM au destinataire |
| `assignNotaireRole` | Callable | Valide code → rôle notaire |
| `certifyProperty` | Callable | Notaire certifie/rejette bien |
| `createAdmin` | Callable | Admin crée nouveau compte admin |
| `onNewChatMessage` | Firestore onCreate `/messages/{id}` | Notification chat + push offline |
| `onReportCreated` | Firestore onCreate `/reports/{id}` | Modération auto (keywords, spam, Levenshtein) |
| `cleanupOrphanedFiles` | Scheduler (quotidien 3h) | Supprime fichiers orphelins Storage |
| `aggregateDailyStats` | Scheduler (quotidien 23h59) | Agrège stats dans `daily_stats/{date}` |
