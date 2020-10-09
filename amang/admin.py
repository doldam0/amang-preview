from django.contrib import admin
from django.contrib.auth.models import Group, User
from .models import Generation, Session, Department, Member, MemberSession, Attendance, Schedule, Information

# Register your models here.
admin.site.register(Generation)
admin.site.register(Session)
admin.site.register(Department)
admin.site.register(Member)
admin.site.register(MemberSession)

admin.site.register(Attendance)
admin.site.register(Schedule)
admin.site.register(Information)

admin.site.unregister(User)
admin.site.unregister(Group)
