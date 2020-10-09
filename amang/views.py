from django.shortcuts import render, redirect
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.contrib.auth import authenticate, login, logout
from .models import Schedule, Member, Information, Attendance, AttendanceStatus
from maya import parse
from main.settings import LANGUAGES

# Create your views here.
def index(request: HttpRequest):
	return render(request, 'amang/index.html', {
		'meeting_link': Information.get().meeting_link,
		'user': request.user,
		'languages': LANGUAGES
	})

def timetable(request: HttpRequest):
	members = Member.objects.all()

	return render(request, 'timetable/timetable.html', {
		'members': members,
		'user': request.user
	})

def get_schedules(request: HttpRequest):
	if 'start' not in request.GET or 'end' not in request.GET:
		schedules = Schedule.get_schedules_of_week()
	else:
		start = request.GET['start']
		end = request.GET['end']

		start = parse(start).datetime()
		end = parse(end).datetime()
		schedules = Schedule.get_schedules_by_range(start, end)
	schedules = [schedule.to_dict() for schedule in schedules]
	return JsonResponse(schedules, safe=False)

def add_schedule(request: HttpRequest):
	schedule = Schedule(
		start=request.POST['start'],
		end=request.POST['end'],
		title=request.POST['title'],
		director=Member.objects.get(pk=request.POST['director'])
	)
	schedule.save()

	return JsonResponse(schedule.to_dict(), safe=False)

def update_schedule(request: HttpRequest):
	schedule_id = request.POST['id']
	schedule = Schedule.objects.get(pk=schedule_id)

	schedule.start = request.POST['start']
	schedule.end = request.POST['end']
	if 'title' in request.POST:
		schedule.title = request.POST['title']
	if 'director' in request.POST:
		schedule.director = Member.objects.get(pk=request.POST['director'])
	schedule.save()

	return JsonResponse(schedule.to_dict(), safe=False)

def delete_schedule(request: HttpRequest, schedule_id: int):
	Schedule.objects.get(pk=schedule_id).delete()
	return HttpResponse('success')

def admin_login(request: HttpRequest):
	password = request.POST['password']
	print(password)
	user = authenticate(request, username='admin', password=password)
	if user is None:
		return HttpResponse('not admin')
	login(request, user)
	return HttpResponse('admin')

def admin_logout(request: HttpRequest):
	logout(request)
	return index(request)

def advanced(request: HttpRequest, method: str = 'settings'):
	if method == 'login' and request.method == 'POST':
		return admin_login(request)

	if not request.user.is_authenticated or not request.user.is_superuser:
		return index(request)

	if method == 'members':
		return render(request, 'advanced/members.html')
	elif method == 'attendance':
		if request.method == 'GET':
			return render(request, 'advanced/attendance.html', {
				'members': Member.objects.all().order_by('name', 'is_active')
			})
		elif request.method == 'POST':
			date = request.POST['date']
			for member in Member.objects.all():
				if f'pk[{member.pk}]' in request.POST:
					att = int(value if (value := str(request.POST[f'attendance[{member.pk}]'])) != '' else 0)
					active = f'active[{member.pk}]' in request.POST

					member.is_active = active
					member.save()

					attendance = Attendance(member=member, date=date, value=AttendanceStatus.by_index(att))
					attendance.save()
			return redirect('/advanced/2/')
	elif method == 'show_attendance':
		if request.method == 'GET':
			return render(request, 'advanced/show_attendance.html')
	elif method == 'logout':
		return render(request, 'advanced/logout.html')
	elif method == 'do_logout':
		return admin_logout(request)
	else:
		if request.method == 'GET':
			return render(request, 'advanced/settings.html', {
				'settings': Information.get().to_tuples()
			})
		elif request.method == 'POST':
			information = Information.get()
			for attr, _, _ in information.to_tuples():
				if attr in request.POST:
					setattr(information, attr, request.POST[attr])
			information.save()
			return redirect('/advanced/0/')
