# Functional inventory

Static candidates from named declarations and top-level PHP file bodies. These IDs identify review units, not verified feature coverage. Reconcile aliases, dead code, handlers and JavaScript before calculating full parity.

| ID | Module | PHP Source | Function | Role | Data Source | Next.js Target | Status |
|---|---|---|---|---|---|---|---|
| DAAM-001 | admin | admin/admin/main.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-002 | admin | admin/admin_history.php | file entry | Admin | SQLite connector marker | /admin/history | ANALYZED |
| DAAM-003 | admin | admin/admin_history.php | executeSendReminder | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-004 | admin | admin/admin_history.php | escapeHtml | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-005 | admin | admin/api_dashboard_data.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-006 | admin | admin/api_toggle_location.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-007 | admin | admin/approve_items.php | file entry | Admin | SQLite connector marker | /admin/approvals | ANALYZED |
| DAAM-008 | admin | admin/edit_durable_article.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-009 | admin | admin/edit_durable_article.php | previewUploadImage | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-010 | admin | admin/edit_durable_article.php | filterClassrooms | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-011 | admin | admin/edit_user.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-012 | admin | admin/import_csv.php | file entry | Admin | Trace includes | /admin/csv | ANALYZED |
| DAAM-013 | admin | admin/insert_Repair.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-014 | admin | admin/logout.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-015 | admin | admin/main.php | file entry | Admin | SQLite connector marker | /admin | ANALYZED |
| DAAM-016 | admin | admin/main.php | animateCountUp | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-017 | admin | admin/main.php | frame | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-018 | admin | admin/main.php | applyDashboardData | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-019 | admin | admin/main.php | loadDashboardData | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-020 | admin | admin/main.php | renderUrgentAlerts | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-021 | admin | admin/main.php | calculateVisualSlices | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-022 | admin | admin/main.php | renderDoughnutChart | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-023 | admin | admin/main.php | renderBarChart | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-024 | admin | admin/main.php | renderRecentActivities | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-025 | admin | admin/main.php | escapeHtml | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-026 | admin | admin/manage_data.php | file entry | Admin | SQLite connector marker | /admin/manage-data | ANALYZED |
| DAAM-027 | admin | admin/manage_data.php | escapeHtml | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-028 | admin | admin/manage_data.php | ShowimgURLDA | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-029 | admin | admin/manage_durable_articles.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-030 | admin | admin/manage_repairs.php | file entry | Admin | SQLite connector marker | /admin/repairs | ANALYZED |
| DAAM-031 | admin | admin/manage_users.php | file entry | Admin | SQLite connector marker | /admin/manage-users | ANALYZED |
| DAAM-032 | admin | admin/manual_remind.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-033 | admin | admin/manual_remind.php | sendResultResponse | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-034 | admin | admin/oauth_callback.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-035 | admin | admin/page_EditDurableArticles.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-036 | admin | admin/page_Repair_AddEdit.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-037 | admin | admin/page_Repair_AddEdit.php | resetRepairForm | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-038 | admin | admin/page_Repair_AddEdit.php | editRepairRow | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-039 | admin | admin/page_Repair_AddEdit.php | deleteRepairRow | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-040 | admin | admin/print_qr.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-041 | admin | admin/print_qrcode.php | file entry | Admin | SQLite connector marker | /admin/print-qrcode | ANALYZED |
| DAAM-042 | admin | admin/print_qrcode.php | applyQrScale | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-043 | admin | admin/process_import.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-044 | admin | admin/process_mail_settings.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-045 | admin | admin/report_details.php | file entry | Admin | SQLite connector marker | /admin/reports | ANALYZED |
| DAAM-046 | admin | admin/report_details.php | calcReportVisualSlices | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-047 | admin | admin/settings_mail.php | file entry | Admin | SQLite connector marker | /admin/mail | ANALYZED |
| DAAM-048 | admin | admin/settings_mail.php | updateFromPreview | Admin | SQLite connector marker | — | ANALYZED |
| DAAM-049 | admin | admin/settings_mail_oauth.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-050 | admin | admin/sync_now.php | file entry | Admin gate marker | Trace includes | — | ANALYZED |
| DAAM-051 | admin | admin/update_Repair.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-052 | user | admin/user/history.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-053 | root | admin_history.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-054 | api | api/sse_dashboard.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-055 | root | api_search_assets.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-056 | root | api_toggle_location.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-057 | root | borrow_request.php | file entry | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-058 | root | borrow_request.php | debounce | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-059 | root | borrow_request.php | setLoading | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-060 | root | borrow_request.php | toggleClearBtn | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-061 | root | borrow_request.php | hideDropdown | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-062 | root | borrow_request.php | showDropdown | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-063 | root | borrow_request.php | clearResults | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-064 | root | borrow_request.php | escapeHtml | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-065 | root | borrow_request.php | highlightMatch | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-066 | root | borrow_request.php | performSearch | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-067 | root | borrow_request.php | renderResults | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-068 | root | borrow_request.php | renderError | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-069 | root | borrow_request.php | selectItem | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-070 | root | borrow_request.php | updateActiveItem | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-071 | root | borrow_request.php | extractAssetIdFromQr | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-072 | root | borrow_request.php | playScanSuccessTone | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-073 | root | borrow_request.php | startQrScanner | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-074 | root | borrow_request.php | stopQrScanner | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-075 | root | borrow_request.php | onQrScanSuccess | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-076 | root | borrow_request.php | onQrScanFailure | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-077 | root | borrow_request.php | toISODateString | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-078 | root | borrow_request.php | parseDateOnly | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-079 | root | borrow_request.php | addDays | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-080 | root | borrow_request.php | syncReturnDateConstraints | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-081 | component | component/admin_footer.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-082 | component | component/admin_header.php | file entry | Admin gate marker | SQLite connector marker | — | ANALYZED |
| DAAM-083 | component | component/admin_navbar.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-084 | component | component/admin_sidebar.php | file entry | Session marker | Trace includes | — | ANALYZED |
| DAAM-085 | component | component/admin_sidebar.php | renderSidebarNavItems | Session marker | Trace includes | — | ANALYZED |
| DAAM-086 | component | component/admin_sidebar.php | renderSidebarUserCard | Session marker | Trace includes | — | ANALYZED |
| DAAM-087 | component | component/nav.php | file entry | Admin gate marker | Trace includes | — | ANALYZED |
| DAAM-088 | control | control/connectDB.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-089 | control | control/connectPDO.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-090 | control | control/connectPDO_dev.php | file entry | Admin gate marker | Trace includes | — | ANALYZED |
| DAAM-091 | control | control/sync_database.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-092 | root | cron_reminder.php | file entry | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-093 | root | db.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-094 | includes | includes/BorrowService.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-095 | includes | includes/BorrowService.php | validateDates | Review required | Trace includes | — | ANALYZED |
| DAAM-096 | includes | includes/BorrowService.php | getAsset | Review required | Trace includes | — | ANALYZED |
| DAAM-097 | includes | includes/BorrowService.php | isAssetAvailable | Review required | Trace includes | — | ANALYZED |
| DAAM-098 | includes | includes/BorrowService.php | getActiveBorrow | Review required | Trace includes | — | ANALYZED |
| DAAM-099 | includes | includes/BorrowService.php | executeBorrow | Review required | Trace includes | — | ANALYZED |
| DAAM-100 | includes | includes/BorrowService.php | requestReturn | Review required | Trace includes | — | ANALYZED |
| DAAM-101 | includes | includes/BorrowService.php | approveReturn | Review required | Trace includes | — | ANALYZED |
| DAAM-102 | includes | includes/BorrowService.php | executeReturn | Review required | Trace includes | — | ANALYZED |
| DAAM-103 | includes | includes/BorrowService.php | deleteBorrowRecord | Review required | Trace includes | — | ANALYZED |
| DAAM-104 | includes | includes/BorrowService.php | approveAsset | Review required | Trace includes | — | ANALYZED |
| DAAM-105 | includes | includes/BorrowService.php | rejectAsset | Review required | Trace includes | — | ANALYZED |
| DAAM-106 | includes | includes/BorrowService.php | getDashboardData | Review required | Trace includes | — | ANALYZED |
| DAAM-107 | root | index.php | file entry | Public | Trace includes | / | IMPLEMENTED_UNVERIFIED |
| DAAM-108 | legacy | legacy/Update_BorrowDA.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-109 | legacy | legacy/del_Building.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-110 | legacy | legacy/del_Classification.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-111 | legacy | legacy/del_Classroom.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-112 | legacy | legacy/del_StatusActive.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-113 | legacy | legacy/index.php | file entry | Session marker | Trace includes | — | ANALYZED |
| DAAM-114 | legacy | legacy/insert_BorrowDA.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-115 | legacy | legacy/insert_Building.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-116 | legacy | legacy/insert_Classification.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-117 | legacy | legacy/insert_Classroom.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-118 | legacy | legacy/insert_DurableArticles.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-119 | legacy | legacy/insert_Repair.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-120 | legacy | legacy/insert_StatusActive.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-121 | legacy | legacy/insert_UserAccount.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-122 | legacy | legacy/loadBuilding.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-123 | legacy | legacy/loadClassification.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-124 | legacy | legacy/loadClassroom.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-125 | legacy | legacy/loadDashboard_CountDA.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-126 | legacy | legacy/loadListClassification.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-127 | legacy | legacy/loadListStatusActive.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-128 | legacy | legacy/loadStatus_Active.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-129 | legacy | legacy/loadTableBorrow_DataDA.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-130 | legacy | legacy/loadTableBorrow_forBack.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-131 | legacy | legacy/loadTableBuilding.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-132 | legacy | legacy/loadTableClassroom.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-133 | legacy | legacy/loadTableDataBorrowBackDA.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-134 | legacy | legacy/loadTableDurableArticles.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-135 | legacy | legacy/loadTableDurableArticlesBySelect.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-136 | legacy | legacy/loadTableUserAccount.php | file entry | Admin gate marker | MySQL connector marker | — | ANALYZED |
| DAAM-137 | legacy | legacy/loadTypeUser.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-138 | legacy | legacy/login.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-139 | legacy | legacy/logout.php | file entry | Session marker | Trace includes | — | ANALYZED |
| DAAM-140 | legacy | legacy/main.php | file entry | Admin gate marker | MySQL connector marker | — | ANALYZED |
| DAAM-141 | legacy | legacy/page_BackDA.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-142 | legacy | legacy/page_BackDA.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-143 | legacy | legacy/page_BackDA.php | setinputDAID | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-144 | legacy | legacy/page_BackDA.php | updateBorrow | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-145 | legacy | legacy/page_BorrowDA.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-146 | legacy | legacy/page_BorrowDA.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-147 | legacy | legacy/page_BorrowDA.php | setinputDAID | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-148 | legacy | legacy/page_BorrowDA.php | insertBorrow | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-149 | legacy | legacy/page_Classification.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-150 | legacy | legacy/page_Classification.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-151 | legacy | legacy/page_Classification.php | resetFormClass | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-152 | legacy | legacy/page_Classification.php | editClassification | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-153 | legacy | legacy/page_Classification.php | updateClassification | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-154 | legacy | legacy/page_Classification.php | addClassification | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-155 | legacy | legacy/page_Classification.php | delClassification | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-156 | legacy | legacy/page_Classroom.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-157 | legacy | legacy/page_Classroom.php | showImg | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-158 | legacy | legacy/page_Classroom.php | EditClassroom | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-159 | legacy | legacy/page_Classroom.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-160 | legacy | legacy/page_Classroom.php | addclassroom | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-161 | legacy | legacy/page_Classroom.php | ShowModalImgClassroom | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-162 | legacy | legacy/page_Classroom.php | resetFormData | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-163 | legacy | legacy/page_Classroom.php | updateClassroom | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-164 | legacy | legacy/page_Classroom.php | DelClassroom | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-165 | legacy | legacy/page_DataborrowbackDA.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-166 | legacy | legacy/page_DataborrowbackDA.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-167 | legacy | legacy/page_DisActiveUseraccount.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-168 | legacy | legacy/page_EditDurableArticles.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-169 | legacy | legacy/page_EditDurableArticles.php | editDurableArticles | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-170 | legacy | legacy/page_EditDurableArticles.php | selectDataClassroom | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-171 | legacy | legacy/page_EditDurableArticles.php | showImg | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-172 | legacy | legacy/page_Edituseraccount.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-173 | legacy | legacy/page_Edituseraccount.php | updateUserAccount | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-174 | legacy | legacy/page_Repair_AddEdit.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-175 | legacy | legacy/page_Repair_AddEdit.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-176 | legacy | legacy/page_Repair_AddEdit.php | resetDataForm | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-177 | legacy | legacy/page_Repair_AddEdit.php | editRepair | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-178 | legacy | legacy/page_Repair_AddEdit.php | updateRepair | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-179 | legacy | legacy/page_Repair_AddEdit.php | addRepair | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-180 | legacy | legacy/page_StatusActive.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-181 | legacy | legacy/page_StatusActive.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-182 | legacy | legacy/page_StatusActive.php | addStatusActive | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-183 | legacy | legacy/page_StatusActive.php | resetFormData | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-184 | legacy | legacy/page_StatusActive.php | editStatusActive | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-185 | legacy | legacy/page_StatusActive.php | updateStatusActive | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-186 | legacy | legacy/page_StatusActive.php | delStatusActive | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-187 | legacy | legacy/page_building.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-188 | legacy | legacy/page_building.php | showImg | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-189 | legacy | legacy/page_building.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-190 | legacy | legacy/page_building.php | EditBuilding | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-191 | legacy | legacy/page_building.php | resetFormData | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-192 | legacy | legacy/page_building.php | updateBuilding | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-193 | legacy | legacy/page_building.php | addBuilding | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-194 | legacy | legacy/page_building.php | DelBuilding | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-195 | legacy | legacy/page_building.php | ShowModalImgBuilding | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-196 | legacy | legacy/page_durable_articles.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-197 | legacy | legacy/page_durable_articles.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-198 | legacy | legacy/page_durable_articles.php | showImg | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-199 | legacy | legacy/page_durable_articles.php | selectDataClassroom | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-200 | legacy | legacy/page_durable_articles.php | ShowimgURLDA | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-201 | legacy | legacy/page_durable_articles.php | addDurableArticles | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-202 | legacy | legacy/page_durable_articles.php | searchDurableArticles | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-203 | legacy | legacy/page_useraccount.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-204 | legacy | legacy/page_useraccount.php | myFunction | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-205 | legacy | legacy/page_useraccount.php | addUserAccount | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-206 | legacy | legacy/test.php | file entry | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-207 | legacy | legacy/update_Building.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-208 | legacy | legacy/update_Classification.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-209 | legacy | legacy/update_Classroom.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-210 | legacy | legacy/update_DurableArticles.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-211 | legacy | legacy/update_Repair.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-212 | legacy | legacy/update_StatusActive.php | file entry | Session marker | MySQL connector marker | — | ANALYZED |
| DAAM-213 | legacy | legacy/update_UserAccount.php | file entry | Review required | MySQL connector marker | — | ANALYZED |
| DAAM-214 | root | login.php | file entry | Public | SQLite connector marker | /login | ANALYZED |
| DAAM-215 | root | login.php | validateSafeRedirect | Public | SQLite connector marker | — | ANALYZED |
| DAAM-216 | root | logout.php | file entry | Session | Trace includes | /api/auth/logout | ANALYZED |
| DAAM-217 | root | mail_config.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-218 | root | mailer.php | file entry | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-219 | root | mailer.php | sanitizeUtf8Recursive | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-220 | root | mailer.php | sendSystemEmail | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-221 | root | mailer.php | sendOverdueReminder | Review required | SQLite connector marker | — | ANALYZED |
| DAAM-222 | root | manual_remind.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-223 | root | migrate_data.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-224 | root | process_mail_settings.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-225 | root | refactor.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-226 | root | register.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-227 | root | register_process.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-228 | root | report_details.php | file entry | Review required | Trace includes | — | ANALYZED |
| DAAM-229 | root | sync_database.php | file entry | Admin gate marker | Trace includes | — | ANALYZED |
| DAAM-230 | root | sync_database.php | logMsg | Admin gate marker | Trace includes | — | ANALYZED |
| DAAM-231 | root | sync_database.php | parseValuesTuples | Admin gate marker | Trace includes | — | ANALYZED |
| DAAM-232 | root | sync_database.php | mapMysqlTypeToSqlite | Admin gate marker | Trace includes | — | ANALYZED |
| DAAM-233 | user | user/borrow_action.php | file entry | Session marker | Trace includes | — | ANALYZED |
| DAAM-234 | user | user/borrow_form.php | file entry | Session marker | Trace includes | — | ANALYZED |
| DAAM-235 | user | user/history.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-236 | user | user/history.php | applyStatusFilter | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-237 | user | user/main.php | file entry | User | SQLite connector marker | /user | ANALYZED |
| DAAM-238 | user | user/process_request_csv.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-239 | user | user/request_item.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-240 | user | user/request_item.php | showSelectedFilename | Session marker | SQLite connector marker | — | ANALYZED |
| DAAM-241 | user | user/return_form.php | file entry | Session marker | SQLite connector marker | — | ANALYZED |
