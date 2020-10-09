from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from enum import Enum
from datetime import datetime, timedelta


sessions = [_('Vocal'), _('Guitar'), _('Bass'), _('Synthesizer'), _('Drum')]
departments = [_('Performance'), _('Planning'), _('Public Relations')]


# Create your models here.
class Group(models.Model):
    reader = models.ForeignKey('Member', verbose_name=_("Reader"),
                               null=True, blank=True, on_delete=models.CASCADE)


class Generation(Group):
    number = models.SmallIntegerField(verbose_name=_('Generation'), primary_key=True)
    is_main = models.BooleanField(verbose_name=_('Main'), default=False)

    chairperson = models.ForeignKey('Member', verbose_name=_('Chairperson'),
                                    related_name='read_generation',
                                    on_delete=models.CASCADE, null=True, blank=True)
    vice_chairperson = models.ForeignKey('Member', verbose_name=_('Vice-Chairperson'),
                                         related_name='vice_read_generation',
                                         on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        verbose_name = _('Generation')
        verbose_name_plural = _('Generations')

    def __str__(self):
        return "%d%s" % (self.number, _('Gen'))


class Team(Group):
    name = models.CharField(verbose_name=_('Name'), max_length=20, unique=True)

    class Meta:
        abstract = True

    def __str__(self):
        return "%s" % _(self.name)


class Session(Team):
    class Meta:
        verbose_name = _('Session')
        verbose_name_plural = _('Sessions')


class Department(Team):
    class Meta:
        verbose_name = _('Department')
        verbose_name_plural = _('Departments')


class Member(models.Model):
    name = models.CharField(verbose_name=_('Name'), max_length=20)
    generation = models.ForeignKey(Generation, verbose_name=_('Generation'), on_delete=models.CASCADE)
    department = models.ForeignKey(Department, verbose_name=_('Department'),
                                   null=True, blank=True, on_delete=models.CASCADE)
    sessions = models.ManyToManyField(Session, verbose_name=_('Sessions'),
                                      through='MemberSession', through_fields=('member', 'session'))
    is_active = models.BooleanField(verbose_name=_('Active'), default=False)

    class Meta:
        verbose_name = _('Member')
        verbose_name_plural = _('Members')

    def __str__(self):
        return self.name

    @staticmethod
    def get_names_all():
        return [member.name for member in Member.objects.all()]

    @staticmethod
    def get_member_by_name(name: str):
        return Member.objects.get(name=name)


class MemberSession(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    priority = models.PositiveSmallIntegerField(verbose_name=_('Priority'), default=1)

    class Meta:
        verbose_name = "%s %s" % (_('Member'), _('Session'))
        verbose_name_plural = "%s %s" % (_('Member'), _('Sessions'))


class AttendanceStatus(Enum):
    ATTENDANCE = _('Attendance')
    LATENESS = _('Lateness')
    ABSENCE = _('Absence')

    @staticmethod
    def choices():
        return [(item.name, item.value) for item in list(AttendanceStatus) if item.name.isupper()]

    @staticmethod
    def by_index(index: int):
        if index == 2:
            return AttendanceStatus.ATTENDANCE
        elif index == 1:
            return AttendanceStatus.LATENESS
        else:
            return AttendanceStatus.ABSENCE


class Attendance(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    date = models.DateField(verbose_name=_('Date'), default=timezone.localtime)
    value = models.CharField(verbose_name=_('Attendance'), choices=AttendanceStatus.choices(),
                             max_length=20, default=AttendanceStatus.ATTENDANCE)

    class Meta:
        verbose_name = _('Attendance')
        verbose_name_plural = _('Attendances')

    def __str__(self):
        return "%s" % _(self.value)


class Schedule(models.Model):
    start = models.DateTimeField(verbose_name=_('Start Time'))
    end = models.DateTimeField(verbose_name=_('End Time'))
    title = models.CharField(verbose_name=_('Title'), max_length=50)
    director = models.ForeignKey(Member, verbose_name=_('Director'), on_delete=models.CASCADE)

    class Meta:
        verbose_name = _('Schedule')
        verbose_name_plural = _('Schedules')

    def __str__(self):
        return self.title

    @staticmethod
    def get_schedules_of_week(day=timezone.localtime()):
        start = day - timedelta(days=day.weekday(), hours=day.hour, minutes=day.minute,
                                seconds=day.second, microseconds=day.microsecond)
        end = start + timedelta(days=7)
        return Schedule.objects.filter(end__gte=start, start__lte=end)

    @staticmethod
    def get_schedules_by_range(start: datetime, end: datetime):
        return Schedule.objects.filter(end__gte=start, start__lte=end)

    def to_dict(self):
        return {
            'id': self.pk,
            'title': self.title,
            'start': self.start,
            'end': self.end,
            'director_name': self.director.name
        }


class Information(models.Model):
    meeting_link = models.CharField(verbose_name=_('Meeting Link'), max_length=100)

    @staticmethod
    def get():
        rec = Information.objects.get(pk=1)
        if isinstance(rec, Information):
            return rec
        else:
            raise ValueError('The record is not instance of Information Model')

    def to_tuples(self):
        return [
            ('meeting_link', _('Meeting Link'), self.meeting_link)
        ]

    def to_dict(self):
        return {key: value for key, _, value in self.to_tuples()}
